# Architecture Decision Records (ADRs) — Parity

This document outlines key technical and architectural decisions made during the design and development of **Parity**, explaining the context, trade-offs, and rationale for review evaluation.

---

## ADR 001: Monorepo Architecture with Shared Contracts

* **Status**: Accepted
* **Context**: The system requires an Express REST API, a React Web application, and a React Native (Expo) mobile application with identical data validation rules and DTO structures.
* **Decision**: Adopt an `npm workspaces` monorepo containing:
  - `apps/api`: Express 4 + TypeScript backend.
  - `apps/web`: React 18 + Vite frontend.
  - `apps/mobile`: React Native (Expo SDK 51) client.
  - `packages/shared`: Shared Zod schemas, TypeScript interfaces, and deterministic health calculation utilities.
* **Consequences & Trade-offs**:
  - Single source of truth for validation prevents schema drift between platforms.
  - Changes to contracts trigger immediate compile-time errors across all consumers.
  - Requires building the shared package before dependent applications (`npm run build --workspace=@ismo/shared`).

---

## ADR 002: Real-Time Cross-Platform Sync via Server-Sent Events (SSE)

* **Status**: Accepted
* **Context**: While the specification only requires changes to update after a manual refresh, live synchronization between web and mobile provides a standout demo experience.
* **Decision**: Implement lightweight Server-Sent Events (`/api/events`) over WebSockets.
* **Rationale**:
  1. **Simplicity & Unidirectional Flow**: Updates originate from server mutations (task/project creations, status updates). Clients only need to listen.
  2. **Compatibility with Free Cloud Hosts**: Standard WebSockets often suffer connection teardowns, timeout drops, or require sticky sessions on serverless/container hosts (Render, Railway, Heroku). SSE works seamlessly over standard HTTP/1.1 and HTTP/2.
  3. **Low Resource Footprint**: Node.js streams events using native chunked encoding with minimal memory overhead, supplemented by a 20-second keep-alive heartbeat.
  4. **Pull-to-Refresh Fallback**: Retained on both mobile and web clients for network disruptions.

---

## ADR 003: Relational Modeling with PostgreSQL and Prisma ORM

* **Status**: Accepted
* **Context**: A structured data model was needed with strict referential integrity, foreign key cascading, and defense against SQL injection.
* **Decision**: Use PostgreSQL with Prisma ORM.
* **Rationale**:
  - Relational normalization (`users`, `projects`, `tasks`, `activity_logs`) with foreign keys (`onDelete: Cascade`) guarantees that deleting a user or project automatically cleans up orphaned tasks and audit events.
  - Prisma parameterizes all queries automatically, eliminating SQL injection attack vectors.
  - Strongly typed client autogeneration guarantees type safety between database schema and application controllers.

---

## ADR 004: JWT Authentication and Device-Level Keystore Storage

* **Status**: Accepted
* **Context**: Users authenticate with a single credential across web and mobile. Sensitive tokens must not be exposed to XSS or device extraction.
* **Decision**:
  - Use signed JSON Web Tokens (`jsonwebtoken`) with HS256 algorithm and a configurable lifespan (`7d`).
  - Passwords hashed with `bcryptjs` using 10 salt rounds; never stored or returned in any API responses.
  - On Web: Token held in memory and browser storage.
  - On Mobile: Token saved **strictly in `expo-secure-store`**, utilizing Android Keystore and iOS Keychain. Plain `AsyncStorage` is avoided.
  - Authentication middleware supports both `Authorization: Bearer <token>` and `?token=<token>` query parameters for browser `EventSource` SSE streams.

---

## ADR 005: Definition of Task & Project States ("Pending" vs "In Progress")

* **Status**: Accepted
* **Context**: Clarifying metric definitions for dashboard counts.
* **Decision**:
  - **Tasks**:
    - `PENDING`: Task has been created and assigned, but work has not yet commenced.
    - `IN_PROGRESS`: Task is actively being executed.
    - `COMPLETED`: Task requirements are fulfilled.
  - **Dashboard Metrics**:
    - `Pending Tasks`: Specifically counts tasks with status `PENDING` (as requested by functional requirement 4).
    - `Completed Tasks`: Specifically counts tasks with status `COMPLETED`.
    - `Projects In Progress`: Specifically counts projects with status `IN_PROGRESS`.

---

## ADR 006: Deterministic Project Health & Focus Queue

* **Status**: Accepted
* **Context**: Users need immediate answers to "What should I work on next?" and "Is my project on track?"
* **Decision**: Implement deterministic calculation algorithms shared between clients:
  - **Project Health**:
    - `COMPLETED`: Status is completed $\rightarrow$ `ON_TRACK`.
    - `OVERDUE`: Current date exceeds `endDate` and `completionPercentage < 100%`.
    - `AT_RISK`: Due within $\le 3$ days and `completionPercentage < 50%`.
    - `ON_TRACK`: Default healthy progression.
  - **Focus Queue**:
    - Filters tasks where `status != 'COMPLETED'`.
    - Ranks by urgency (`dueDate` ascending) and priority (`HIGH` $\rightarrow$ `MEDIUM` $\rightarrow$ `LOW`).

---

## ADR 007: Strict Multi-Tenant Data Scoping & IDOR Prevention

* **Status**: Accepted
* **Context**: Preventing Insecure Direct Object References (IDOR) where User B modifies or accesses User A's data by guessing UUIDs.
* **Decision**:
  - Every database query is scoped to `req.user.id`.
  - When creating or updating tasks, the system explicitly queries the parent `Project` where `id = projectId AND userId = req.user.id`.
  - If a resource belongs to another user, return **HTTP 404 Not Found** (rather than 403 Forbidden) to eliminate resource enumeration vulnerabilities.
