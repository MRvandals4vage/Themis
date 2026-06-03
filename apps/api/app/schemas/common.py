from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class APIMessage(BaseModel):
    message: str


class EntityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
