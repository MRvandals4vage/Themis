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


class IncidentSearchMatch(BaseModel):
    incident_id: str | None = None
    title: str | None = None
    root_cause: str | None = None
    category: str | None = None
    resolution: str | None = None
    patch: str | None = None
    outcome: str | None = None
    score: float


class IncidentAnalysisResponse(BaseModel):
    category: str
    root_cause: str
    confidence: float
    summary: str
    similar_incidents: list[IncidentSearchMatch] = []


class RemediationResponse(BaseModel):
    success: bool
    branch_name: str
    pr_url: str
    patch_content: str


class IncidentSearchRequest(BaseModel):
    query: str
    limit: int = 3
