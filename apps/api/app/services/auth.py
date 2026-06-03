from app.core.security import create_access_token


class AuthService:
    async def issue_development_token(self, email: str) -> str:
        return create_access_token(subject=email, claims={"roles": ["owner"]})
