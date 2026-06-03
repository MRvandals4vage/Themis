# Themis API

Base URL: `http://localhost:8000`

## Health

- `GET /health`
- `GET /health/database`
- `GET /health/redis`
- `GET /health/qdrant`

## Versioned API

- `POST /api/v1/auth/token`
- `GET /api/v1/users`
- `GET /api/v1/repositories`
- `GET /api/v1/pipelines`
- `GET /api/v1/incidents`
- `POST /api/v1/incidents`
- `GET /api/v1/agents/workflow`
- `GET /api/v1/rag`
- `GET /api/v1/notifications`
- `GET /api/v1/analytics/summary`

Interactive OpenAPI documentation is available at `http://localhost:8000/docs` while the API is running.
