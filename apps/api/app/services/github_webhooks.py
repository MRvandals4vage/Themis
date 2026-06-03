import hashlib
import hmac
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Incident, Organization, Pipeline, PipelineRun, Repository
from app.models.enums import (
    IncidentSeverity,
    IncidentStatus,
    PipelineProvider,
    PipelineRunStatus,
)
from app.repositories.incidents import IncidentRepository
from app.repositories.pipelines import PipelineRepository, PipelineRunRepository
from app.repositories.repositories import RepositoryRepository

SUPPORTED_GITHUB_EVENTS = {"workflow_run", "check_run", "push", "pull_request"}


@dataclass(frozen=True)
class NormalizedPipelineRun:
    provider: PipelineProvider
    repository: str
    repository_external_id: str
    repository_url: str
    default_branch: str
    workflow_name: str
    workflow_external_id: str
    run_external_id: str
    branch: str
    commit_sha: str
    status: PipelineRunStatus
    conclusion: str | None
    started_at: datetime | None
    completed_at: datetime | None
    raw_payload: dict[str, Any]


class GitHubWebhookService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repositories = RepositoryRepository(session)
        self.pipelines = PipelineRepository(session)
        self.pipeline_runs = PipelineRunRepository(session)
        self.incidents = IncidentRepository(session)

    def verify_signature(self, body: bytes, signature: str | None) -> None:
        if not signature or not signature.startswith("sha256="):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing GitHub webhook signature.",
            )
        expected = hmac.new(
            settings.github_webhook_secret.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        supplied = signature.removeprefix("sha256=")
        if not hmac.compare_digest(expected, supplied):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid GitHub webhook signature.",
            )

    async def ingest(
        self, event: str, payload: dict[str, Any]
    ) -> tuple[PipelineRun | None, Incident | None, str | None]:
        if event not in SUPPORTED_GITHUB_EVENTS:
            return None, None, "unsupported_event"
        if event != "workflow_run":
            return None, None, "event_filtered"

        normalized = self.normalize_workflow_run(payload)
        repository = await self.register_repository(normalized)
        pipeline = await self.register_pipeline(repository, normalized)
        pipeline_run = await self.store_pipeline_run(pipeline, normalized)
        incident = await self.create_incident_if_failed(pipeline_run, normalized)
        return pipeline_run, incident, None

    def normalize_workflow_run(self, payload: dict[str, Any]) -> NormalizedPipelineRun:
        workflow_run = payload.get("workflow_run") or {}
        repository = payload.get("repository") or {}
        head_commit = workflow_run.get("head_commit") or {}
        conclusion = workflow_run.get("conclusion")

        return NormalizedPipelineRun(
            provider=PipelineProvider.GITHUB_ACTIONS,
            repository=repository.get("full_name") or "unknown/unknown",
            repository_external_id=str(
                repository.get("id") or repository.get("node_id") or "unknown"
            ),
            repository_url=repository.get("html_url") or "",
            default_branch=repository.get("default_branch") or "main",
            workflow_name=workflow_run.get("name")
            or payload.get("workflow", {}).get("name")
            or "GitHub Workflow",
            workflow_external_id=str(
                workflow_run.get("workflow_id") or workflow_run.get("name") or "github-workflow"
            ),
            run_external_id=str(
                workflow_run.get("id") or workflow_run.get("run_number") or "unknown"
            ),
            branch=workflow_run.get("head_branch") or repository.get("default_branch") or "main",
            commit_sha=workflow_run.get("head_sha") or head_commit.get("id") or "",
            status=self.map_status(workflow_run.get("status"), conclusion),
            conclusion=conclusion,
            started_at=self.parse_datetime(workflow_run.get("run_started_at")),
            completed_at=self.parse_datetime(workflow_run.get("updated_at")),
            raw_payload=payload,
        )

    def map_status(self, status_value: str | None, conclusion: str | None) -> PipelineRunStatus:
        if conclusion == "failure":
            return PipelineRunStatus.FAILED
        if conclusion == "success":
            return PipelineRunStatus.SUCCESS
        if status_value in {"queued", "in_progress", "requested", "waiting"}:
            return PipelineRunStatus.RUNNING
        if conclusion in {"cancelled", "skipped", "timed_out"}:
            return PipelineRunStatus.CANCELLED
        return PipelineRunStatus.RUNNING

    def parse_datetime(self, value: str | None) -> datetime | None:
        if not value:
            return None
        return datetime.fromisoformat(value.replace("Z", "+00:00"))

    async def register_repository(self, run: NormalizedPipelineRun) -> Repository:
        repository = await self.repositories.get_by_external_id(
            run.provider, run.repository_external_id
        )
        if repository:
            return repository

        organization = await self.get_or_create_default_organization()
        repository = Repository(
            organization_id=organization.id,
            provider=run.provider,
            external_id=run.repository_external_id,
            name=run.repository,
            url=run.repository_url,
            default_branch=run.default_branch,
        )
        return await self.repositories.add(repository)

    async def register_pipeline(
        self, repository: Repository, run: NormalizedPipelineRun
    ) -> Pipeline:
        pipeline = await self.pipelines.get_by_external_id(run.provider, run.workflow_external_id)
        if pipeline:
            return pipeline
        pipeline = Pipeline(
            repository_id=repository.id,
            name=run.workflow_name,
            provider=run.provider,
            external_id=run.workflow_external_id,
            config_path=".github/workflows",
        )
        return await self.pipelines.add(pipeline)

    async def store_pipeline_run(
        self, pipeline: Pipeline, run: NormalizedPipelineRun
    ) -> PipelineRun:
        pipeline_run = await self.pipeline_runs.get_by_external_id(run.run_external_id)
        attrs = {
            "pipeline_id": pipeline.id,
            "provider": run.provider,
            "repository": run.repository,
            "workflow_name": run.workflow_name,
            "external_id": run.run_external_id,
            "branch": run.branch,
            "commit_sha": run.commit_sha,
            "status": run.status,
            "conclusion": run.conclusion,
            "started_at": run.started_at,
            "completed_at": run.completed_at,
            "finished_at": run.completed_at,
            "raw_payload": run.raw_payload,
        }
        if pipeline_run:
            for key, value in attrs.items():
                setattr(pipeline_run, key, value)
            await self.session.flush()
            return pipeline_run
        return await self.pipeline_runs.add(PipelineRun(**attrs))

    async def create_incident_if_failed(
        self, pipeline_run: PipelineRun, run: NormalizedPipelineRun
    ) -> Incident | None:
        if run.conclusion != "failure":
            return None
        existing = await self.incidents.get_by_pipeline_run_id(pipeline_run.id)
        if existing:
            return existing
        incident = Incident(
            pipeline_run_id=pipeline_run.id,
            title=f"{run.workflow_name} failed on {run.branch}",
            summary=(
                f"{run.repository} workflow {run.workflow_name} "
                f"failed for commit {run.commit_sha}."
            ),
            severity=self.classify_severity(run),
            status=IncidentStatus.OPEN,
        )
        return await self.incidents.add(incident)

    def classify_severity(self, run: NormalizedPipelineRun) -> IncidentSeverity:
        name = run.workflow_name.lower()
        if "deploy" in name or "release" in name or "production" in name:
            return IncidentSeverity.HIGH
        if "lint" in name or "format" in name or "static" in name:
            return IncidentSeverity.LOW
        return IncidentSeverity.MEDIUM

    async def get_or_create_default_organization(self) -> Organization:
        result = await self.session.execute(
            select(Organization).where(
                Organization.slug == "default", Organization.deleted_at.is_(None)
            )
        )
        organization = result.scalar_one_or_none()
        if organization:
            return organization
        organization = Organization(name="Default Organization", slug="default")
        self.session.add(organization)
        await self.session.flush()
        return organization
