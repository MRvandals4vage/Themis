from datetime import datetime

from pydantic import BaseModel


class DashboardMetric(BaseModel):
    label: str
    value: str


class DashboardPipelineRun(BaseModel):
    id: str
    repository: str
    workflow_name: str
    branch: str
    commit_sha: str
    status: str
    conclusion: str | None
    completed_at: datetime | None


class DashboardIncident(BaseModel):
    id: str
    title: str
    severity: str
    status: str
    repository: str
    workflow_name: str
    created_at: datetime


class DashboardSummary(BaseModel):
    active_incidents: int
    failed_pipelines: int
    pipeline_history: list[DashboardPipelineRun]
    mttr_seconds: int
    recent_failures: list[DashboardIncident]
