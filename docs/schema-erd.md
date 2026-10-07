# Database Schema & Entity-Relationship (ER) Diagram

This project uses **PostgreSQL** normalized to the 3rd Normal Form (3NF) and managed via **Prisma ORM**.

## ER Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "owns (1:N)"
    USERS ||--o{ TASKS : "owns (1:N)"
    PROJECTS ||--o{ TASKS : "contains (1:N, ON DELETE CASCADE)"

    USERS {
        String id PK "UUID"
        String email UK "Unique, lowercased"
        String passwordHash "Bcrypt hash"
        String fullName "User's display name"
        DateTime createdAt "Auto timestamp"
        DateTime updatedAt "Auto timestamp"
    }

    PROJECTS {
        String id PK "UUID"
        String userId FK "References USERS.id (CASCADE)"
        String name "Project name (max 120 chars)"
        String description "Optional description (max 1000 chars)"
        ProjectStatus status "NOT_STARTED | IN_PROGRESS | COMPLETED"
        DateTime startDate "Optional start date"
        DateTime endDate "Optional end date (endDate >= startDate)"
        DateTime createdAt "Auto timestamp"
        DateTime updatedAt "Auto timestamp"
    }

    TASKS {
        String id PK "UUID"
        String projectId FK "References PROJECTS.id (CASCADE)"
        String userId FK "References USERS.id (CASCADE)"
        String name "Task title (max 120 chars)"
        String description "Optional description (max 1000 chars)"
        TaskPriority priority "LOW | MEDIUM | HIGH"
        TaskStatus status "PENDING | IN_PROGRESS | COMPLETED"
        DateTime dueDate "Optional due timestamp"
        DateTime createdAt "Auto timestamp"
        DateTime updatedAt "Auto timestamp"
    }
```

## Relational Constraints & Indexing Strategy

1. **Foreign Key Cascades (`ON DELETE CASCADE`)**:
   - Deleting a `User` cascades to delete all their `Project` records and `Task` records.
   - Deleting a `Project` cascades to delete all associated `Task` records.
2. **Direct `userId` on Tasks for Defense-in-Depth**:
   - `Task` maintains both `projectId` and `userId`. This allows efficient, single-index user-scoped task filtering (`WHERE userId = ?`) while enforcing that every task's `projectId` also belongs to the authenticated user.
3. **Optimized Indexes**:
   - `projects(userId)` - Fast retrieval of a user's projects.
   - `projects(status)` - Status filter index.
   - `tasks(projectId)` - Fast join / lookup of tasks by project.
   - `tasks(userId)` - Fast dashboard aggregations and cross-project task filtering.
   - `tasks(status)` & `tasks(priority)` - Filtering and dashboard counts.
