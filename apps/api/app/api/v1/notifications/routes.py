from fastapi import APIRouter

from app.schemas.common import APIMessage

router = APIRouter()


@router.get("", response_model=APIMessage)
async def notifications_index() -> APIMessage:
    return APIMessage(message="Notification delivery boundary is registered.")
