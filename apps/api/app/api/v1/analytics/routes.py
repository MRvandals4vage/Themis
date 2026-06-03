from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_session
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("/summary")
async def analytics_summary() -> dict[str, int]:
    return {"open_incidents": 0, "automated_analyses": 0, "mean_time_to_recommendation_seconds": 0}


@router.get("/dashboard", response_model=DashboardSummary)
async def dashboard_summary(session: AsyncSession = Depends(get_session)) -> DashboardSummary:
    return await DashboardService(session).get_summary()
