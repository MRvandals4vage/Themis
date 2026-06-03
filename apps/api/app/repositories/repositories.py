from app.models import Repository
from app.models.enums import PipelineProvider
from app.repositories.base import SQLAlchemyRepository


class RepositoryRepository(SQLAlchemyRepository[Repository]):
    model = Repository

    async def get_by_external_id(
        self, provider: PipelineProvider, external_id: str
    ) -> Repository | None:
        from sqlalchemy import select

        result = await self.session.execute(
            select(Repository).where(
                Repository.provider == provider,
                Repository.external_id == external_id,
                Repository.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
