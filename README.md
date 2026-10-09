# Parity — Unified Project Management Platform (Web + Mobile)

[![CI](https://github.com/Aru-0504/parity/actions/workflows/ci.yml/badge.svg)](https://github.com/Aru-0504/parity/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo_SDK_51-000020?logo=expo&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)


**Parity** is a production-grade, full-stack project management platform consisting of an **Express REST API**, a **React (Vite) Web Application**, and a **React Native (Expo) Mobile Application**, powered by a shared **PostgreSQL** database and shared TypeScript / Zod validation contracts.

### Standout Features Beyond the Spec
1. **Live Cross-Device Sync (SSE)**: Instant sub-second real-time sync across web and mobile using Server-Sent Events (`/api/events`). When a task is added or updated on Web, it reflects live on Mobile without needing manual reload (with pull-to-refresh as a reliable fallback).
2. **Interactive Kanban Board (Web & Mobile)**: Drag-and-drop workflow on Web with reactive drop zones and quick-move status transition bars on Mobile across `PENDING`, `IN_PROGRESS`, and `COMPLETED`.
3. **Interactive Timeline & Calendar View (Web & Mobile)**: Monthly calendar grid, 14-day date strip, and Gantt schedule overview highlighting milestones, due dates, and overdue alerts.
4. **Offline-First Optimistic Sync Queue (Mobile)**: Persistent local storage (`expo-secure-store`) allowing instant app launch, optimistic task mutations, and automatic replay/flush when network connectivity restores.
5. **Smart Focus Queue ("What to do next?")**: Automatically ranks active tasks across all projects by urgency and priority (`HIGH` $\rightarrow$ `MEDIUM` $\rightarrow$ `LOW`).
6. **Deterministic Project Health**: Live computation of project trajectory (`ON_TRACK`, `AT_RISK`, `OVERDUE`) based on schedule timeline and completion percentage.
7. **Audit Trail & Activity Log**: Real-time project activity timeline recording all state changes and task completions.
8. **Architectural Decision Records & Security Report**: Documented in [`DECISIONS.md`](file:///DECISIONS.md) and [`SECURITY.md`](file:///SECURITY.md).

---

## Table of Contents
1. [Monorepo Architecture](#monorepo-architecture)
2. [Security & Design Highlights](#security--design-highlights)
3. [Prerequisites](#prerequisites)
4. [Quickstart Setup](#quickstart-setup)
5. [Database Setup & Seeding](#database-setup--seeding)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Running Locally](#running-locally)
   - [Backend API](#1-backend-api)
   - [Frontend Web App](#2-frontend-web-app)
   - [Mobile App (Expo)](#3-mobile-app-expo)
8. [Docker Compose (API + PostgreSQL)](#docker-compose-api--postgresql)
9. [Automated Integration Tests](#automated-integration-tests)
10. [Building the Android APK](#building-the-android-apk)
11. [Cross-Platform Sync Demo Video Script](#cross-platform-sync-demo-video-script)
12. [Architectural Decision Records & Security](#architectural-decision-records--security)
13. [Deliverable Links & References](#deliverable-links--references)

---

## Architecture

```text
ismo-assessment/
├── apps/
│   ├── api/                 # Node.js + Express + Prisma (PostgreSQL) REST API
│   │   ├── prisma/          # schema.prisma, migrations & seed.ts
│   │   ├── src/             # Controllers, routes, middleware, security
│   │   └── Dockerfile       # Multi-stage production container
│   ├── web/                 # React (Vite) + Tailwind CSS + Lucide
│   └── mobile/              # React Native (Expo) + expo-secure-store + NetInfo
├── packages/
│   └── shared/              # Shared Zod schemas, DTOs & TypeScript contracts
├── docs/
│   ├── api-documentation.md # Markdown REST API specification
│   ├── postman_collection.json # Importable Postman collection
│   └── schema-erd.md        # Mermaid Entity-Relationship diagram
├── docker-compose.yml       # Production-ready compose for DB + API
└── .github/workflows/ci.yml # Automated CI pipeline (lint, build, test)
```

---

## Security & Design Highlights

1. **Strict Multi-Tenant Scoping & IDOR Prevention**:
   - Every database query for projects and tasks is strictly scoped to `req.user.id`.
   - **Cross-user IDOR Defense**: When creating or updating a task, the API explicitly verifies that the specified `projectId` is owned by the authenticated user. If a user attempts to view, edit, or delete a resource belonging to someone else, the API returns **`404 Not Found`** to prevent enumeration attacks.
2. **Device-Level Keystore & Keychain Security**:
   - Mobile authentication tokens are stored exclusively using `expo-secure-store` (backed by **Android Keystore** and **iOS Keychain**), never in plaintext `AsyncStorage` or localStorage.
3. **Session Expiry Handling**:
   - Expired tokens return HTTP 401 with `{ code: "TOKEN_EXPIRED" }`. The mobile Axios interceptor detects this code, purges the SecureStore credential, and safely returns the user to the login screen with an informative alert dialog.
4. **Network Loss Protection**:
   - NetInfo monitors network connectivity in real time, rendering an unobtrusive alert banner instead of crashing or freezing.
5. **SQL Injection & Data Integrity**:
   - Parameterized queries via Prisma ORM protect against SQL injection.
   - Enforced database constraints: `ON DELETE CASCADE` ensures child tasks are automatically cleaned up when projects or accounts are deleted.
6. **Rate Limiting & Password Hashing**:
   - `express-rate-limit` enforces strict IP-based request limits on `/api/auth/*` (30 requests per 15 min).
   - Passwords hashed with `bcryptjs` (salt rounds: 10) and never returned in API payloads.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node v20 & v24)
- **npm**: v9+
- **PostgreSQL**: Local PostgreSQL, Docker, or Cloud PostgreSQL 
- **Expo Go App** (for Android physical device testing) or Android Studio emulator.

---

## Quickstart Setup

Clone the repository and install all monorepo dependencies in one command:

```bash
git clone <your-repository-url>
cd ismo-assessment
npm install
```

Build the shared validation package:
```bash
npm run build --workspace=@ismo/shared
```

---

## Database Setup & Seeding

### 1. Configure Database Connection
Copy the environment template in `apps/api`:
```bash
cp apps/api/.env.example apps/api/.env
```
Edit `DATABASE_URL` in `apps/api/.env` with your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/project_management?schema=public"
```

### 2. Run Database Migrations
Create the normalized tables, foreign keys, and indexes:
```bash
npx prisma migrate dev --schema=./apps/api/prisma/schema.prisma --name init
```

### 3. Seed Demo Data
Populate realistic projects, tasks, and test accounts:
```bash
npx ts-node ./apps/api/prisma/seed.ts
```

#### Seeded Test Credentials:
| Account | Email | Password | Role / Purpose |
| :--- | :--- | :--- | :--- |
| **Primary Demo** | `demo@example.com` | `Password123!` | Loaded with 3 projects & 8 tasks across all statuses |
| **Secondary User** | `sarah@example.com` | `Password123!` | Used to verify user isolation & access denial |

*(Note: Both the Web and Mobile login screens include a **"Fill Demo Account"** button for instant one-tap evaluation).*

---

## ⚙️ Environment Variables Reference

### Backend (`apps/api/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/project_management?schema=public` |
| `PORT` | API listen port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `super_secret_jwt_key_at_least_32_characters_long` |
| `JWT_EXPIRES_IN` | Session token lifespan | `7d` |
| `CORS_ORIGIN` | Permitted origins for web CORS requests | `http://localhost:5173,http://localhost:3000` |

### Web App (`apps/web/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL (empty defaults to `/api` proxy) | `/api` |

### Mobile App (`apps/mobile/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | API endpoint URL reachable by device/emulator | `http://<your-lan-ip>:5000/api` |

---

## Running Locally

### 1. Backend API
```bash
npm run dev:api
```
*API will run on [http://localhost:5000/api](http://localhost:5000/api)*  
*Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)*

### 2. Frontend Web App
In a new terminal:
```bash
npm run dev:web
```
*Web client will open on [http://localhost:5173](http://localhost:5173)*

### 3. Mobile App (Expo)
In a new terminal:
```bash
npm run dev:mobile
```
- **Android Emulator**: Press `a` in the Expo terminal.
- **Physical Device**: Scan the generated QR code using the **Expo Go** app on your phone.
- *Tip: When testing on a physical phone, ensure your phone and computer are on the same Wi-Fi network and set `EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LOCAL_IP>:5000/api` in `apps/mobile/.env`.*

---

## Docker Compose (API + PostgreSQL)

To start both PostgreSQL and the API service in isolated Docker containers:

```bash
docker compose up --build
```
This initializes PostgreSQL on port 5432, waits for its health check, automatically applies Prisma database migrations, and exposes the API on port 5000.

---

## Automated Integration Tests

Run comprehensive Supertest integration tests covering authentication, input validations, date constraints, and cross-user data isolation:

```bash
npm run test --workspace=api
```

What is tested:
- Registration validation & password length enforcement
- Duplicate email prevention (HTTP 409)
- Password security (hash verification, passwordHash excluded from output)
- Start date vs. end date validation (`endDate >= startDate`)
- **Cross-user isolation**: User B cannot view User A's projects (HTTP 404)
- **IDOR prevention**: User B cannot create or update tasks under User A's project (HTTP 404)

---

## Building the Android APK

The mobile application is pre-configured for Expo Application Services (EAS) in `apps/mobile/eas.json`:

```bash
cd apps/mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
This triggers an EAS cloud build that produces a standalone `.apk` installable on any Android device without Expo Go.

---

## Cross-Platform Sync Demo Video Script

Follow this 5-minute walkthrough to demonstrate end-to-end sync:

1. **Pre-recording**:
   - Ensure the API backend is running (`http://localhost:5000`).
   - Open Web App at `http://localhost:5173` on one side of your monitor.
   - Open Android Emulator or Expo Go on the other side.
2. **Login Step**:
   - Click **"Fill Demo Account"** on the Web App and sign in.
   - Click **"Fill Demo Account"** on the Mobile App and sign in with the exact same account (`demo@example.com`).
   - Show the matching dashboard metrics (Total Projects: 3, Total Tasks: 8).
3. **Web to Mobile Sync**:
   - On the **Web App**, go to "Projects", open "Mobile Application Launch", and click **"Add Task"**.
   - Create task: `"Finalize presentation recording"` (Priority: HIGH).
   - Switch to the **Mobile App**, open the same project, and perform a **pull-to-refresh**.
   - Point out that `"Finalize presentation recording"` appears immediately with the High priority badge.
4. **Mobile to Web Sync**:
   - On the **Mobile App**, tap the checkmark icon next to the new task to mark it **Completed**.
   - Switch to the **Web App**, refresh the browser tab.
   - Show that the task is now crossed out / marked Completed and project progress updated.
5. **Network / Security Demonstration**:
   - Toggle Airplane Mode on mobile to demonstrate the clean **No Internet Connection** banner.
   - Highlight that tokens are secured in Android Keystore via `expo-secure-store`.

---

## Architectural Decision Records & Security

- **Architectural Decision Records (ADRs)**: [`DECISIONS.md`](file:///DECISIONS.md) detailing why Prisma, why Monorepo, why SSE over WebSockets, and state definitions.
- **Security & Threat Model Verification**: [`SECURITY.md`](file:///SECURITY.md) detailing bcrypt, rate limiting, and automated multi-tenant isolation proofs.

---

## Deliverable Links & References

- **GitHub Repository**: [https://github.com/Aru-0504/parity](https://github.com/Aru-0504/parity)
- **Render Deployment Guide**: [`docs/RENDER_DEPLOYMENT.md`](file:///docs/RENDER_DEPLOYMENT.md)
- **Architecture Decisions**: [`DECISIONS.md`](file:///DECISIONS.md)
- **Security Policy & Tests**: [`SECURITY.md`](file:///SECURITY.md)
- **API Documentation**: [`docs/api-documentation.md`](file:///docs/api-documentation.md)
- **Postman Collection**: [`docs/postman_collection.json`](file:///docs/postman_collection.json)
- **Database Schema & ERD**: [`docs/schema-erd.md`](file:///docs/schema-erd.md)
