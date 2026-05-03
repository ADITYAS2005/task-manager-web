# TaskFlow — Team Task Manager

A production-grade full-stack team task management app with role-based access control (Admin / Member), built with Node.js + Express + MongoDB (backend) and React + Vite + Tailwind CSS (frontend). Deployed as two independent services on Railway.

---

## Live URLs

| Service  | URL |
|----------|-----|
| Frontend | `https://taskflow-frontend.up.railway.app` |
| Backend  | `https://taskflow-backend.up.railway.app`  |

> Replace with your actual Railway URLs after deployment.

---

## Architecture

```
taskflow/
├── backend/          ← Node.js / Express REST API (Railway Service 1)
│   ├── src/
│   │   ├── config/       ← MongoDB connection
│   │   ├── controllers/  ← Route handlers
│   │   ├── middleware/   ← Auth, RBAC, error handler, validator
│   │   ├── models/       ← Mongoose schemas (User, Project, Task)
│   │   ├── routes/       ← Express routers
│   │   ├── utils/        ← Logger, ApiResponse, catchAsync
│   │   ├── validators/   ← express-validator chains
│   │   ├── app.js        ← Express app setup
│   │   └── server.js     ← Entry point + graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
└── frontend/         ← React + Vite + Tailwind SPA (Railway Service 2)
    ├── src/
    │   ├── api/          ← Axios instance + per-resource API modules
    │   ├── components/   ← Reusable UI components
    │   ├── contexts/     ← AuthContext (JWT + refresh token)
    │   ├── pages/        ← Route-level page components
    │   └── utils/        ← Helpers, constants
    ├── .env.example
    ├── package.json
    └── railway.toml
```

---

## Features

- **Authentication** — Signup / Login with JWT access + refresh tokens. Auto-refresh on 401.
- **Role-based access** — Global Admin (full access) vs Member (own tasks, projects they're in).
- **Projects** — Create, edit, delete projects. Track progress with live completion bar. Invite/remove members.
- **Tasks** — Full CRUD. Assign to members, set priority & status, due dates, tags, comments.
- **Dashboard** — Stats overview (total, in-progress, overdue), status breakdown bars, recent tasks feed.
- **Team Members** (Admin only) — View all users, toggle roles, activate/deactivate, delete users.
- **Security** — Helmet, CORS, mongo-sanitize (NoSQL injection prevention), rate limiting, bcrypt password hashing.

---

## REST API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/signup` | Public | Register |
| POST | `/api/v1/auth/login` | Public | Login → tokens |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |
| POST | `/api/v1/auth/logout` | 🔒 | Revoke refresh token |
| GET  | `/api/v1/auth/me` | 🔒 | Get current user |
| PATCH | `/api/v1/auth/me` | 🔒 | Update profile |
| PATCH | `/api/v1/auth/change-password` | 🔒 | Change password |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/projects` | 🔒 | List my projects |
| POST | `/api/v1/projects` | 🔒 Admin | Create project |
| GET | `/api/v1/projects/:id` | 🔒 Member | Get project |
| PATCH | `/api/v1/projects/:id` | 🔒 Project Admin | Update project |
| DELETE | `/api/v1/projects/:id` | 🔒 Admin | Delete project + tasks |
| GET | `/api/v1/projects/:id/members` | 🔒 Member | List members |
| POST | `/api/v1/projects/:id/members` | 🔒 Project Admin | Add member |
| DELETE | `/api/v1/projects/:id/members/:userId` | 🔒 Project Admin | Remove member |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/projects/:projectId/tasks` | 🔒 | List project tasks |
| POST | `/api/v1/projects/:projectId/tasks` | 🔒 | Create task |
| GET | `/api/v1/tasks/my` | 🔒 | My tasks (all projects) |
| GET | `/api/v1/tasks/dashboard-stats` | 🔒 | Dashboard stats |
| GET | `/api/v1/tasks/:id` | 🔒 | Get task detail |
| PATCH | `/api/v1/tasks/:id` | 🔒 | Update task |
| DELETE | `/api/v1/tasks/:id` | 🔒 Admin | Delete task |
| POST | `/api/v1/tasks/:id/comments` | 🔒 | Add comment |
| DELETE | `/api/v1/tasks/:id/comments/:cid` | 🔒 | Delete comment |

### Users (Admin only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users` | 🔒 Admin | List all users |
| GET | `/api/v1/users/:id` | 🔒 Admin | Get user |
| PATCH | `/api/v1/users/:id` | 🔒 Admin | Update user role / status |
| DELETE | `/api/v1/users/:id` | 🔒 Admin | Delete user |

---

## Local Development

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free tier works) or local MongoDB

### Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL
npm install
npm run dev
# → http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev
# → http://localhost:3000
```

---

## Deploy to Railway (Step-by-step)

### 1. Push to GitHub
Create two separate repos (or one monorepo with two Railway services pointing to subfolders):
```bash
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/yourname/taskflow
git push -u origin main
```

### 2. Deploy Backend
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo → set **Root Directory** to `backend`
3. Add environment variables (from `backend/.env.example`):
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — random 32+ char string
   - `JWT_REFRESH_SECRET` — another random 32+ char string
   - `NODE_ENV=production`
   - `CLIENT_URL` — leave blank for now, fill after frontend deploys
4. Railway auto-detects Node.js and runs `node src/server.js`
5. Copy the generated backend URL (e.g. `https://taskflow-backend-xxx.up.railway.app`)

### 3. Deploy Frontend
1. In the same Railway project → **New Service** → **GitHub repo**
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   - `VITE_API_URL=https://taskflow-backend-xxx.up.railway.app/api/v1`
4. Copy the generated frontend URL

### 4. Update CORS
Back in backend service → add variable:
- `CLIENT_URL=https://taskflow-frontend-xxx.up.railway.app`

Railway automatically redeploys on every push to `main`.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (32+ chars) |
| `JWT_EXPIRES_IN` | — | Default: `7d` |
| `JWT_REFRESH_EXPIRES_IN` | — | Default: `30d` |
| `CLIENT_URL` | ✅ | Frontend origin for CORS |
| `PORT` | — | Default: `5000` (Railway sets this) |
| `NODE_ENV` | ✅ | `production` or `development` |
| `BCRYPT_SALT_ROUNDS` | — | Default: `12` |
| `RATE_LIMIT_MAX` | — | Default: `100` requests per window |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL |

---

## Tech Stack

**Backend**
- Node.js 18+ / Express 4
- MongoDB / Mongoose 8
- JSON Web Tokens (jsonwebtoken)
- bcryptjs, helmet, cors, express-rate-limit
- express-validator, express-mongo-sanitize
- Winston (structured logging)

**Frontend**
- React 18 / Vite 5
- Tailwind CSS 3
- TanStack Query v5 (server state)
- Axios (with auto refresh token interceptor)
- React Router v6
- react-hot-toast

---

## Folder Structure Conventions

- **Controllers** — pure business logic, no Express-specific code leakage
- **Routes** — wire validators → middleware → controller
- **Middleware** — authenticate (JWT verify), authorize (role check), authorizeProjectAccess (membership check)
- **Utils** — `catchAsync` wraps all async handlers; `ApiResponse` standardizes all JSON responses
- **Models** — Mongoose schemas with indexes, virtuals, and instance methods

---

## Demo Credentials

After signup, create an admin account:
```
Email: admin@demo.com
Password: Admin123
Role: admin
```
