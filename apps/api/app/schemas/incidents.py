from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import IncidentSeverity, IncidentStatus


class IncidentCreate(BaseModel):
    pipeline_run_id: UUID
    title: str
    summary: str
    severity: IncidentSeverity


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    summary: str
    severity: IncidentSeverity
    status: IncidentStatus


class IncidentAnalysisRequest(BaseModel):
    logs: str | None = None


class IncidentAnalysisResponse(BaseModel):
    category: str
    root_cause: str
    confidence: float
