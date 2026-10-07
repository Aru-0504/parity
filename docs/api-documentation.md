# API Specification & Documentation

Base URL: `http://localhost:5000/api` (or deployed URL: `https://<your-backend-domain>/api`)

All endpoints returning protected resources require the HTTP header:
`Authorization: Bearer <jwt-token>`

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Rate Limit**: 30 requests per 15 minutes per IP
- **Request Body**:
```json
{
  "fullName": "Alex Rivera",
  "email": "demo@example.com",
  "password": "Password123!"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "e8df4567-e89b-12d3-a456-426614174000",
      "fullName": "Alex Rivera",
      "email": "demo@example.com",
      "createdAt": "2026-10-07T00:00:00.000Z",
      "updatedAt": "2026-10-07T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Request Body**:
```json
{
  "email": "demo@example.com",
  "password": "Password123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Get Current User
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Returns the authenticated user profile.

### 1.4 Logout
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`

---

## 2. Project Endpoints

### 2.1 List Projects
- **Method**: `GET`
- **Path**: `/api/projects`
- **Query Parameters**:
  - `search` (string, optional): Search by project name
  - `status` (string, optional): `NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`
  - `sortBy` (string, optional): `createdAt` | `name` | `startDate` | `endDate` | `status`
  - `sortOrder` (string, optional): `asc` | `desc` (default: `desc`)
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f5e43a2b-...",
      "userId": "e8df4567-...",
      "name": "Mobile Application Launch",
      "description": "Cross-platform mobile client",
      "status": "IN_PROGRESS",
      "startDate": "2026-10-01T00:00:00.000Z",
      "endDate": "2026-10-25T00:00:00.000Z",
      "createdAt": "2026-10-01T00:00:00.000Z",
      "updatedAt": "2026-10-05T00:00:00.000Z",
      "_count": { "tasks": 4 }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "totalCount": 1, "totalPages": 1 }
}
```

### 2.2 Get Project by ID
- **Method**: `GET`
- **Path**: `/api/projects/:id`
- **Response (200 OK)**: Returns project details and nested task items.

### 2.3 Create Project
- **Method**: `POST`
- **Path**: `/api/projects`
- **Request Body**:
```json
{
  "name": "Brand Redesign & Marketing",
  "description": "Visual identity overhaul",
  "status": "NOT_STARTED",
  "startDate": "2026-10-10",
  "endDate": "2026-11-10"
}
```

### 2.4 Update Project
- **Method**: `PUT`
- **Path**: `/api/projects/:id`
- **Request Body**: Same fields as Create Project (all optional).

### 2.5 Delete Project
- **Method**: `DELETE`
- **Path**: `/api/projects/:id`
- **Response (200 OK)**: Deletes project and cascades to all child tasks.

---

## 3. Task Endpoints

### 3.1 List Tasks
- **Method**: `GET`
- **Path**: `/api/tasks`
- **Query Parameters**:
  - `projectId` (string, optional): Filter by project
  - `search` (string, optional): Filter by task name
  - `status` (string, optional): `PENDING` | `IN_PROGRESS` | `COMPLETED`
  - `priority` (string, optional): `LOW` | `MEDIUM` | `HIGH`
  - `sortBy` (string, default: `createdAt`)
  - `sortOrder` (string, default: `desc`)
  - `page` (number, default: 1)
  - `limit` (number, default: 30)

### 3.2 Create Task
- **Method**: `POST`
- **Path**: `/api/tasks`
- **Request Body**:
```json
{
  "projectId": "f5e43a2b-...",
  "name": "Implement JWT authentication",
  "description": "Store token in secure storage",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-10-15T18:00:00.000Z"
}
```

### 3.3 Update Task
- **Method**: `PUT`
- **Path**: `/api/tasks/:id`
- **Request Body**: `name`, `description`, `priority`, `status`, `dueDate`, `projectId`.

### 3.4 Delete Task
- **Method**: `DELETE`
- **Path**: `/api/tasks/:id`

---

## 4. Dashboard Endpoint

### 4.1 Get Dashboard Statistics
- **Method**: `GET`
- **Path**: `/api/dashboard`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 3,
      "totalTasks": 8,
      "completedTasks": 3,
      "pendingTasks": 3,
      "inProgressProjects": 1,
      "projectsByStatus": {
        "notStarted": 1,
        "inProgress": 1,
        "completed": 1
      },
      "tasksByStatus": {
        "pending": 3,
        "inProgress": 2,
        "completed": 3
      },
      "tasksByPriority": {
        "low": 1,
        "medium": 3,
        "high": 4
      }
    },
    "recentProjects": [ ... ]
  }
}
```

---

## 5. Security & Error Response Format

All error responses strictly adhere to:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR | UNAUTHORIZED | TOKEN_EXPIRED | FORBIDDEN | NOT_FOUND | RATE_LIMITED",
  "message": "Human readable error description",
  "errors": {
    "field": ["Field specific error message"]
  }
}
```
*Note: In the mobile app, when `code === "TOKEN_EXPIRED"`, the app immediately resets stored session state and routes back to login with a user notification.*
