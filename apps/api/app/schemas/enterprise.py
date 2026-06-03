from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole


class TeamCreate(BaseModel):
    name: str


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    organization_id: UUID
    name: str
    created_at: datetime


class TeamMemberCreate(BaseModel):
    user_id: UUID


class TeamMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    team_id: UUID
    user_id: UUID
    created_at: datetime


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    team_id: UUID | None = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    organization_id: UUID
    team_id: UUID | None = None
    name: str
    description: str | None = None
    created_at: datetime


class UserRoleUpdate(BaseModel):
    role: UserRole


class LinkRepositoryPayload(BaseModel):
    repository_id: UUID


# Fleet Management Analytics schemas
class FleetRepositoryAnalytics(BaseModel):
    id: UUID
    name: str
    healthy: bool
    incident_count: int
    mttr_seconds: int
    project_name: str | None = None
    team_name: str | None = None


class ProjectAnalytics(BaseModel):
    id: UUID
    name: str
    failure_rate: float
    incident_count: int
    health_score: int


class FleetAnalyticsReport(BaseModel):
    total_repositories: int
    active_incidents: int
    mttr_seconds: int
    healthy_projects: int
    repositories: list[FleetRepositoryAnalytics]
    projects: list[ProjectAnalytics]
