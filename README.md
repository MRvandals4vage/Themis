# Themis

Themis is an AI-powered DevOps Intelligence Platform for detecting, investigating, and resolving CI/CD pipeline failures.

## Stack

- Frontend: Next.js 15, TypeScript, TailwindCSS, shadcn-style components, TanStack Query, Zustand
- Backend: FastAPI, Python 3.12, async SQLAlchemy, Alembic
- Data: PostgreSQL, Redis, Qdrant
- AI: OpenAI SDK foundation, LangGraph workflow, RAG service interfaces
- Infrastructure: Docker and Docker Compose

## Monorepo

```text
apps/
  web/
  api/
packages/
  shared/
  types/
  ui/
infrastructure/
docs/
scripts/
```

## Local Development

```bash
npm install
docker compose up --build
```

Run migrations after PostgreSQL is healthy:

```bash
docker compose exec api alembic upgrade head
```

Web: `http://localhost:3000`

API: `http://localhost:8000`

API docs: `http://localhost:8000/docs`

## Architecture

See [docs/Architecture.md](docs/Architecture.md) and [docs/API.md](docs/API.md).
