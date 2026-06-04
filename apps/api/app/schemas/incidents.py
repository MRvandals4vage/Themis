from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import AgentExecutionStatus, IncidentSeverity, IncidentStatus


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
    remediation: dict | None = None


class ValidationReport(BaseModel):
    linter_passed: bool
    linter_output: str
    tests_passed: bool
    tests_output: str
    risk_level: str  # "low", "medium", "high"
    risk_assessment: str


class RemediationResponse(BaseModel):
    success: bool
    branch_name: str
    pr_url: str
    patch_content: str
    validation: ValidationReport | None = None


class SelfHealingStage(BaseModel):
    name: str
    status: str  # "success", "failed", "skipped", "pending"
    message: str | None = None


class SelfHealingResponse(BaseModel):
    incident_id: UUID
    success: bool
    stages: list[SelfHealingStage]
    pr_url: str | None = None
    validation: ValidationReport | None = None


class IncidentSearchRequest(BaseModel):
    query: str
    limit: int = 3


class AgentExecutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    incident_id: UUID
    agent_name: str
    status: AgentExecutionStatus
    input_payload: dict
    output_payload: dict
    error_message: str | None = None
    created_at: datetime
