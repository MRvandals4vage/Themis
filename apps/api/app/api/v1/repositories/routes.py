from fastapi import APIRouter

from app.schemas.common import APIMessage

router = APIRouter()


@router.get("", response_model=APIMessage)
async def repositories_index() -> APIMessage:
    return APIMessage(message="Repository ingestion boundaries are registered.")
