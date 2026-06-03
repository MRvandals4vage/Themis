from app.models import Pipeline, PipelineRun
from app.models.enums import PipelineProvider
from app.repositories.base import SQLAlchemyRepository


class PipelineRepository(SQLAlchemyRepository[Pipeline]):
    model = Pipeline

    async def get_by_external_id(
        self, provider: PipelineProvider, external_id: str
    ) -> Pipeline | None:
        from sqlalchemy import select

        result = await self.session.execute(
            select(Pipeline).where(
                Pipeline.provider == provider,
                Pipeline.external_id == external_id,
                Pipeline.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()


class PipelineRunRepository(SQLAlchemyRepository[PipelineRun]):
    model = PipelineRun

    async def get_by_external_id(self, external_id: str) -> PipelineRun | None:
        from sqlalchemy import select

        result = await self.session.execute(
            select(PipelineRun).where(
                PipelineRun.external_id == external_id,
                PipelineRun.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
