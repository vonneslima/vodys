# 🎓 Vodys

> A production-grade study management SaaS — organize subjects, track tasks, run Pomodoro sessions, and view progress in real time.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand · TanStack Query |
| Backend | Node.js · Express · TypeScript |
| Database | PostgreSQL · Prisma ORM |
| Cache | Redis |
| Auth | JWT + Refresh Tokens · bcrypt |
| Realtime | Socket.io (WebSocket) |
| Testing | Jest · Supertest |
| API Docs | Swagger / OpenAPI |
| DevOps | Docker · Docker Compose · GitHub Actions |

---

## Architecture

```
Vodys/
├── backend/          Express API (layered: routes → controllers → services → repositories)
│   ├── src/
│   │   ├── config/       Env validation, DB, Redis, Socket, Swagger
│   │   ├── controllers/  HTTP handlers — thin, delegate to services
│   │   ├── services/     Business logic — single responsibility
│   │   ├── middlewares/  Auth, roles, rate limit, validation, error handling
│   │   ├── routes/       Express routers
│   │   ├── schemas/      Zod validation schemas
│   │   └── utils/        JWT, bcrypt, logger, response helpers, pagination
│   └── prisma/           Schema + seed
└── frontend/         Next.js (App Router — RSC + client components as needed)
    └── src/
        ├── app/          Pages and layouts (route groups)
        ├── components/   UI primitives + feature components
        ├── hooks/        Data-fetching and UI hooks
        ├── store/        Zustand global state
        ├── lib/          Axios client + auth API + utils
        └── types/        Shared TypeScript types
```

---

## Quick Start (local, no Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### 1. Clone & install

```bash
git clone https://github.com/your-org/Vodys.git
cd Vodys

# Backend
cd backend
cp .env.example .env        # Fill in values
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                 # http://localhost:3001

# Frontend (new terminal)
cd ../frontend
cp .env.example .env.local  # Fill in values
npm install
npm run dev                 # http://localhost:3000
```

### 2. Open in browser
- App: http://localhost:3000
- API Docs: http://localhost:3001/api-docs
- Demo login: `demo@Vodys.dev` / `Demo@123!`
- Admin login: `admin@Vodys.dev` / `Admin@123!`

---

## Docker (recommended)

```bash
# Development stack (hot-reload + MailHog)
docker compose up --build

# Services:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:3001
#   Swagger   → http://localhost:3001/api-docs
#   MailHog   → http://localhost:8025
#   Postgres  → localhost:5432
#   Redis     → localhost:6379
```

---

## Tests

```bash
cd backend

# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Access token secret (≥32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret (≥32 chars) | — |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CLIENT_URL` | Frontend URL (CORS) | `http://localhost:3000` |
| `SMTP_*` | Email provider settings | — |
| `BCRYPT_ROUNDS` | bcrypt work factor | `12` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_APP_URL` | Frontend public URL |

---

## Production Deploy

### 1. Build Docker images

```bash
docker build -t Vodys-backend:latest ./backend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  -t Vodys-frontend:latest ./frontend
```

### 2. Push to registry

```bash
docker tag Vodys-backend:latest ghcr.io/your-org/Vodys-backend:latest
docker tag Vodys-frontend:latest ghcr.io/your-org/Vodys-frontend:latest
docker push ghcr.io/your-org/Vodys-backend:latest
docker push ghcr.io/your-org/Vodys-frontend:latest
```

### 3. Deploy with docker-compose

```bash
# On your server
cp backend/.env.example backend/.env    # Fill production values
docker compose -f docker-compose.prod.yml up -d
```

### 4. CI/CD (GitHub Actions)
Push to `main` → lint + test + build images + SSH deploy automatically.

Required GitHub secrets:
- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`

---

## Features

- ✅ **Auth** — Register, login, logout, refresh tokens, forgot/reset password, role-based access
- ✅ **Dashboard** — Metrics, weekly progress chart, upcoming tasks
- ✅ **Subjects** — Create, edit, delete, archive study subjects with color/icon
- ✅ **Tasks** — Kanban board (To Do / In Progress / Done), subtasks, tags, priorities, deadlines
- ✅ **Calendar** — Monthly view with events per day
- ✅ **Pomodoro** — Functional timer, short/long breaks, session history, streak tracking
- ✅ **Notifications** — Real-time via WebSocket, mark read, delete
- ✅ **Profile** — Edit info, upload avatar, change password, theme preference
- ✅ **Admin Panel** — User management, platform stats, activate/deactivate users
- ✅ **Dark/Light/System** theme
- ✅ **Responsive** — Mobile-first design with collapsible sidebar

---

## Security

- Helmet.js security headers
- Rate limiting (global + per-route: auth, upload, password reset)
- JWT rotation — refresh tokens are single-use
- Token blacklisting via Redis on logout
- bcrypt password hashing (12 rounds)
- Zod input validation on all endpoints
- CORS restricted to allowed origins
- SQL injection impossible via Prisma parameterized queries
- Non-root Docker containers

---

## License

MIT © Vodys
