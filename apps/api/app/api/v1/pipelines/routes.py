from fastapi import APIRouter

from app.schemas.common import APIMessage

router = APIRouter()


@router.get("", response_model=APIMessage)
async def pipelines_index() -> APIMessage:
    return APIMessage(message="Pipeline and run ingestion boundaries are registered.")
