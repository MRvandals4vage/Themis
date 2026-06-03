from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import PipelineProvider, PipelineRunStatus


class PipelineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    repository_id: UUID
    name: str
    provider: PipelineProvider


class PipelineRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pipeline_id: UUID
    external_id: str
    branch: str
    commit_sha: str
    status: PipelineRunStatus
