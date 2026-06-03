from fastapi import APIRouter

from app.api.v1.agents.routes import router as agents_router
from app.api.v1.analytics.routes import router as analytics_router
from app.api.v1.auth.routes import router as auth_router
from app.api.v1.incidents.routes import router as incidents_router
from app.api.v1.notifications.routes import router as notifications_router
from app.api.v1.pipelines.routes import router as pipelines_router
from app.api.v1.rag.routes import router as rag_router
from app.api.v1.repositories.routes import router as repositories_router
from app.api.v1.users.routes import router as users_router
from app.api.v1.webhooks.routes import router as webhooks_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(repositories_router, prefix="/repositories", tags=["repositories"])
api_router.include_router(pipelines_router, prefix="/pipelines", tags=["pipelines"])
api_router.include_router(incidents_router, prefix="/incidents", tags=["incidents"])
api_router.include_router(agents_router, prefix="/agents", tags=["agents"])
api_router.include_router(rag_router, prefix="/rag", tags=["rag"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
