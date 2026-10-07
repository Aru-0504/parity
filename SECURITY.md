# Security Policy & Implementation Report — Parity

This document outlines the security architecture, threat model, and defense mechanisms implemented within **Parity**.

---

## 🛡️ Security Architecture Overview

| Security Domain | Mitigation / Technology | Details |
| :--- | :--- | :--- |
| **Authentication** | JWT (JSON Web Tokens) + `bcryptjs` | 10 salt rounds; password hashes strictly excluded from all outputs. |
| **Authorization / IDOR** | Strict `userId` scoping | Queries enforced to `req.user.id`; returns 404 on cross-user access to prevent enumeration. |
| **Mobile Credential Storage** | `expo-secure-store` | Backed by **Android Keystore** and **iOS Keychain**; avoids plain storage. |
| **Brute-Force Protection** | `express-rate-limit` | IP rate limit of 30 requests per 15 minutes on `/api/auth/*`. |
| **Injection Defense** | Prisma ORM | Automated query parameterization; zero raw SQL concatenation. |
| **Input Validation** | Zod Schemas | Strict type, length, regex email, and date constraint validation (`endDate >= startDate`). |
| **Session Expiry** | Axios Interceptors | 401 with `{ code: 'TOKEN_EXPIRED' }` clears SecureStore and redirects to login with message. |
| **Network Loss Handling** | NetInfo Listener | Graceful warning banner instead of unhandled exceptions or blank screens. |

---

## 🔒 Deep-Dive Security Controls

### 1. Insecure Direct Object Reference (IDOR) Prevention
Every route accessing a Project or Task validates ownership:
- **Project Access**:
  ```ts
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!project) return res.status(404).json({ code: 'NOT_FOUND' });
  ```
- **Task Ownership & Project Parent Validation**:
  When a user creates a task under a `projectId`, the API first validates that the `projectId` is owned by `req.user.id`. A malicious user cannot attach tasks to another tenant's project even if they know the project UUID.

### 2. Password Security & Hashing
- Passwords are never logged or stored in plaintext.
- Hashing is performed using `bcryptjs` with salt round factor 10.
- All Prisma database queries select explicit fields or omit `passwordHash` before payload serialization.

### 3. Mobile Device Security (`expo-secure-store`)
Tokens on the React Native mobile application are stored with hardware-backed encryption:
- **Android**: Data encrypted using keys stored in the **Android Keystore system**.
- **iOS**: Data encrypted and stored in the **iOS Keychain**.
- Prevents local inspection via rooting, adb backup, or plaintext extraction.

### 4. Input Sanitization & Zod Enforcement
All request bodies pass through strongly typed middleware schemas:
- Email must conform to valid RFC formats.
- Password minimum length is enforced (minimum 8 characters).
- Project dates must validate chronologically (`endDate >= startDate`).
- Strings are trimmed to avoid whitespace injection.

---

## 🧪 Automated Security & Isolation Tests

The backend includes automated integration tests (`apps/api/src/__tests__/auth_and_isolation.test.ts`) covering:
1. **Password Hash Omission**: Ensures `res.body.data.user.passwordHash` is `undefined`.
2. **Duplicate Email Prevention**: Returns HTTP 409 Conflict.
3. **Cross-Tenant Access Denial**:
   - User A creates a project.
   - User B attempts `GET /api/projects/:id` $\rightarrow$ Returns **HTTP 404**.
   - User B project list (`GET /api/projects`) $\rightarrow$ User A's project is absent.
4. **Cross-Tenant IDOR Task Creation Denial**:
   - User B attempts `POST /api/tasks` pointing to User A's `projectId` $\rightarrow$ Returns **HTTP 404**.
5. **Cross-Tenant Task Modification Denial**:
   - User B attempts `PUT /api/tasks/:id` belonging to User A $\rightarrow$ Returns **HTTP 404**.

---

## 🚨 Reporting Security Issues

To report vulnerabilities or security concerns, contact the project maintainer at `https://github.com/Aru-0504/parity/issues`.
