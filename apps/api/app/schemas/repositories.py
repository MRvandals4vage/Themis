from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import PipelineProvider


class RepositoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    provider: PipelineProvider
    name: str
    url: str
