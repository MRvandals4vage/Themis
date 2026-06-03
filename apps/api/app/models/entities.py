from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    AgentExecutionStatus,
    IncidentSeverity,
    IncidentStatus,
    PipelineProvider,
    PipelineRunStatus,
    UserRole,
)


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)

    users: Mapped[list["User"]] = relationship(back_populates="organization")
    repositories: Mapped[list["Repository"]] = relationship(back_populates="organization")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="users")


class Repository(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "repositories"
    __table_args__ = (
        Index(
            "ix_repositories_org_provider_external", "organization_id", "provider", "external_id"
        ),
    )

    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    provider: Mapped[PipelineProvider] = mapped_column(
        Enum(PipelineProvider, name="pipeline_provider"), nullable=False
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    default_branch: Mapped[str] = mapped_column(String(255), default="main", nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="repositories")
    pipelines: Mapped[list["Pipeline"]] = relationship(back_populates="repository")


class Pipeline(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "pipelines"
    __table_args__ = (Index("ix_pipelines_repository_name", "repository_id", "name"),)

    repository_id: Mapped[UUID] = mapped_column(ForeignKey("repositories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[PipelineProvider] = mapped_column(
        Enum(PipelineProvider, name="pipeline_provider"), nullable=False
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    config_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    repository: Mapped[Repository] = relationship(back_populates="pipelines")
    runs: Mapped[list["PipelineRun"]] = relationship(back_populates="pipeline")


class PipelineRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "pipeline_runs"
    __table_args__ = (
        Index("ix_pipeline_runs_pipeline_status_started", "pipeline_id", "status", "started_at"),
        Index("ix_pipeline_runs_external_id", "external_id"),
    )

    pipeline_id: Mapped[UUID] = mapped_column(ForeignKey("pipelines.id"), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    branch: Mapped[str] = mapped_column(String(255), nullable=False)
    commit_sha: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[PipelineRunStatus] = mapped_column(
        Enum(PipelineRunStatus, name="pipeline_run_status"), nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    logs_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    pipeline: Mapped[Pipeline] = relationship(back_populates="runs")
    incident: Mapped["Incident | None"] = relationship(back_populates="pipeline_run")


class Incident(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "incidents"
    __table_args__ = (
        Index("ix_incidents_status_severity_created", "status", "severity", "created_at"),
    )

    pipeline_run_id: Mapped[UUID] = mapped_column(
        ForeignKey("pipeline_runs.id"), nullable=False, unique=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[IncidentSeverity] = mapped_column(
        Enum(IncidentSeverity, name="incident_severity"), nullable=False
    )
    status: Mapped[IncidentStatus] = mapped_column(
        Enum(IncidentStatus, name="incident_status"), nullable=False
    )

    pipeline_run: Mapped[PipelineRun] = relationship(back_populates="incident")
    analysis: Mapped["IncidentAnalysis | None"] = relationship(back_populates="incident")
    agent_executions: Mapped[list["AgentExecution"]] = relationship(back_populates="incident")


class IncidentAnalysis(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "incident_analysis"

    incident_id: Mapped[UUID] = mapped_column(
        ForeignKey("incidents.id"), nullable=False, unique=True
    )
    root_cause: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=False)
    similar_incidents: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    remediation: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    incident: Mapped[Incident] = relationship(back_populates="analysis")


class AgentExecution(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "agent_executions"
    __table_args__ = (
        Index("ix_agent_executions_incident_agent_status", "incident_id", "agent_name", "status"),
    )

    incident_id: Mapped[UUID] = mapped_column(ForeignKey("incidents.id"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[AgentExecutionStatus] = mapped_column(
        Enum(AgentExecutionStatus, name="agent_execution_status"), nullable=False
    )
    input_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    output_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    incident: Mapped[Incident] = relationship(back_populates="agent_executions")


class Embedding(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "embeddings"
    __table_args__ = (
        Index(
            "ix_embeddings_org_collection_external",
            "organization_id",
            "collection_name",
            "external_id",
        ),
    )

    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    collection_name: Mapped[str] = mapped_column(String(120), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    vector_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    content_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class Notification(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_org_read_created", "organization_id", "read_at", "created_at"),
    )

    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    incident_id: Mapped[UUID | None] = mapped_column(ForeignKey("incidents.id"), nullable=True)
    channel: Mapped[str] = mapped_column(String(80), nullable=False)
    recipient: Mapped[str] = mapped_column(String(320), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
