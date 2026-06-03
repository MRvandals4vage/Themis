from fastapi import APIRouter

from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import AuthService

router = APIRouter()


@router.post("/token", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    token = await AuthService().issue_development_token(payload.email)
    return TokenResponse(access_token=token)
