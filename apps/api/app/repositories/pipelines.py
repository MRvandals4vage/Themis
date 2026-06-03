from app.models import Pipeline, PipelineRun
from app.repositories.base import SQLAlchemyRepository


class PipelineRepository(SQLAlchemyRepository[Pipeline]):
    model = Pipeline


class PipelineRunRepository(SQLAlchemyRepository[PipelineRun]):
    model = PipelineRun
