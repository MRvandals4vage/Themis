from fastapi import APIRouter

from app.schemas.common import APIMessage

router = APIRouter()


@router.get("", response_model=APIMessage)
async def users_index() -> APIMessage:
    return APIMessage(message="User and RBAC endpoints are ready for implementation.")
