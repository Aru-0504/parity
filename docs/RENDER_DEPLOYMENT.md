# Render Deployment Guide

This guide walks you through deploying the complete **Parity** monorepo (PostgreSQL Database, Node.js/Express API, and React/Vite Web App) to [Render](https://render.com).

---

## Method 1: 1-Click Render Blueprint (Recommended)

The repository includes a ready-to-use [`render.yaml`](../render.yaml) blueprint file. Render will automatically provision the PostgreSQL database, API backend, and static web frontend in one step.

### Step 1: Push Code to GitHub / GitLab
Make sure your changes including `render.yaml` are pushed to your remote Git repository:
```bash
git add .
git commit -m "chore: add render deployment configuration"
git push origin main
```

### Step 2: Create a Blueprint Instance on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. In the top right corner, click **New +** and select **Blueprint**.
3. Connect your repository (`ismo-assessment` / `parity`).
4. Render will read `render.yaml` and show the 3 resources it will create:
   - **`parity-db`** (PostgreSQL Database - Free)
   - **`parity-api`** (Web Service - Node - Free)
   - **`parity-web`** (Static Site - React/Vite - Free)
5. Click **Apply**.

Render will deploy the database, build the API, run database migrations, and deploy the frontend.

---

## Method 2: Manual Dashboard Setup

If you prefer setting up each service manually via the Render web UI:

### Step 1: Create the PostgreSQL Database
1. Click **New +** -> **PostgreSQL**.
2. **Name**: `parity-db`
3. **Database**: `project_management`
4. **User**: `postgres`
5. **Plan**: `Free`
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (for API on Render) and **External Database URL** (for remote access/seeding).

---

### Step 2: Deploy the Backend API (`apps/api`)
1. Click **New +** -> **Web Service**.
2. Select your repository.
3. Configure settings:
   - **Name**: `parity-api`
   - **Runtime**: `Node`
   - **Region**: Same region as your database (e.g., Oregon or Frankfurt)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: *(leave blank — repository root)*
   - **Build Command**:
     ```bash
     npm install && npm run build:api
     ```
   - **Start Command**:
     ```bash
     npm run prisma:deploy && npm run start:api
     ```
   - **Plan**: `Free`
   - **Health Check Path**: `/api/health`
4. Add **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | |
   | `DATABASE_URL` | *(paste Internal DB URL from Step 1)* | Connects to Render PostgreSQL |
   | `JWT_SECRET` | *(generate a random 32+ character string)* | e.g. `openssl rand -hex 32` |
   | `JWT_EXPIRES_IN` | `7d` | |
   | `CORS_ORIGIN` | `*` | Or comma-separated frontend URLs |
5. Click **Create Web Service**.
6. Note down your API URL: `https://parity-api.onrender.com`.

---

### Step 3: Deploy the Frontend Web App (`apps/web`)
1. Click **New +** -> **Static Site**.
2. Select your repository.
3. Configure settings:
   - **Name**: `parity-web`
   - **Branch**: `main`
   - **Root Directory**: *(leave blank — repository root)*
   - **Build Command**:
     ```bash
     npm install && npm run build:web
     ```
   - **Publish Directory**: `apps/web/dist`
4. Add **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://parity-api.onrender.com/api` *(replace with your API URL)* |
5. Add **Redirects / Rewrites** (under **Redirects/Rewrites** tab):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - *(Ensures client-side React Router routing works on refresh)*
6. Click **Create Static Site**.

---

## Step 4: Seed Initial Demo Data (Optional)

To seed the initial demo accounts (`demo@example.com` / `Password123!`):

### Option A: Using the Render Shell Tab (Fastest)
1. In your Render Dashboard, go to your **`parity-api`** Web Service.
2. Click on the **Shell** tab.
3. Run:
   ```bash
   npm run prisma:seed
   ```

### Option B: From Your Local Machine
Run the seed script from your local terminal pointing to Render's **External Database URL**:
```bash
DATABASE_URL="<RENDER_EXTERNAL_DATABASE_URL>" npm run prisma:seed
```

---

## Verification Checklist

- [ ] API Health Check: `GET https://parity-api.onrender.com/api/health` returns `{"status":"ok"}`.
- [ ] API Root Check: `GET https://parity-api.onrender.com/api` returns endpoints list.
- [ ] Web App Login: Open `https://parity-web.onrender.com/login` and log in with `demo@example.com` / `Password123!`.
- [ ] Live Sync (SSE): Notice the green connection badge in the top right header indicating active real-time updates.
