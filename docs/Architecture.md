# Themis Architecture

Themis is structured as a horizontally scalable SaaS platform with a typed Next.js console, a FastAPI control plane, PostgreSQL persistence, Redis caching and queue primitives, Qdrant vector retrieval, and LangGraph-based agent orchestration.

```mermaid
flowchart LR
  Web[Next.js Console] --> API[FastAPI API]
  API --> Postgres[(PostgreSQL)]
  API --> Redis[(Redis)]
  API --> Qdrant[(Qdrant)]
  API --> Graph[LangGraph Workflow]
  GitHub[GitHub Actions] --> API
  GitLab[GitLab CI] --> API
  Jenkins[Jenkins] --> API
```

## Agent Workflow

```mermaid
flowchart TD
  A[Failure Event] --> B[Classifier Agent]
  B --> C[Root Cause Agent]
  C --> D[RAG Retrieval Agent]
  D --> E[Fix Recommendation Agent]
  E --> F[Reporter Agent]
```

## Backend Boundaries

- `auth`: JWT issuance and future enterprise identity integration.
- `users`: user lifecycle and RBAC foundation.
- `repositories`: SCM repository inventory.
- `pipelines`: CI/CD pipeline and run ingestion.
- `incidents`: failure case management and analysis records.
- `agents`: LangGraph workflow orchestration.
- `rag`: embedding, vector search, retrieval, and reranking interfaces.
- `notifications`: delivery foundation for alerts and reports.
- `analytics`: operational and executive metrics.
