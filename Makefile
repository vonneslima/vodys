.PHONY: dev build test lint seed migrate clean help

# ─── Development ─────────────────────────────────────────────────────────────
dev:
	docker compose up --build

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

# ─── Database ─────────────────────────────────────────────────────────────────
migrate:
	cd backend && npx prisma migrate dev

migrate-prod:
	cd backend && npx prisma migrate deploy

seed:
	cd backend && npx prisma db seed

studio:
	cd backend && npx prisma studio

# ─── Build ────────────────────────────────────────────────────────────────────
build:
	cd backend && npm run build
	cd frontend && npm run build

build-docker:
	docker build -t Vodys-backend:latest ./backend
	docker build -t Vodys-frontend:latest ./frontend

# ─── Tests ────────────────────────────────────────────────────────────────────
test:
	cd backend && npm test

test-coverage:
	cd backend && npm run test:coverage

# ─── Lint ─────────────────────────────────────────────────────────────────────
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

format:
	cd backend && npm run format
	cd frontend && npm run format

# ─── Install ──────────────────────────────────────────────────────────────────
install:
	cd backend && npm install
	cd frontend && npm install

# ─── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	docker compose down -v
	rm -rf backend/dist backend/coverage frontend/.next frontend/out

# ─── Production ───────────────────────────────────────────────────────────────
prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

# ─── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "Vodys — Available commands:"
	@echo ""
	@echo "  make dev            Start full dev stack (Docker)"
	@echo "  make dev-backend    Start backend only (local)"
	@echo "  make dev-frontend   Start frontend only (local)"
	@echo "  make migrate        Run DB migrations (dev)"
	@echo "  make seed           Seed database with demo data"
	@echo "  make studio         Open Prisma Studio"
	@echo "  make test           Run backend tests"
	@echo "  make test-coverage  Run tests with coverage report"
	@echo "  make lint           Lint backend + frontend"
	@echo "  make format         Format backend + frontend"
	@echo "  make install        Install all dependencies"
	@echo "  make build          Build backend + frontend"
	@echo "  make build-docker   Build Docker images"
	@echo "  make prod-up        Start production stack"
	@echo "  make clean          Remove build artifacts + Docker volumes"
	@echo ""
