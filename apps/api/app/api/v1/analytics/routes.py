from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
async def analytics_summary() -> dict[str, int]:
    return {"open_incidents": 0, "automated_analyses": 0, "mean_time_to_recommendation_seconds": 0}
