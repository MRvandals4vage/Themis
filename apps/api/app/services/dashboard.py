from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Incident, PipelineRun
from app.models.enums import IncidentStatus, PipelineRunStatus
from app.schemas.dashboard import DashboardIncident, DashboardPipelineRun, DashboardSummary


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_summary(self) -> DashboardSummary:
        active_incidents = await self.count_active_incidents()
        failed_pipelines = await self.count_failed_pipelines()
        pipeline_history = await self.pipeline_history()
        recent_failures = await self.recent_failures()
        return DashboardSummary(
            active_incidents=active_incidents,
            failed_pipelines=failed_pipelines,
            pipeline_history=pipeline_history,
            mttr_seconds=await self.mttr_seconds(),
            recent_failures=recent_failures,
        )

    async def count_active_incidents(self) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Incident)
            .where(
                Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]),
                Incident.deleted_at.is_(None),
            )
        )
        return int(result.scalar_one())

    async def count_failed_pipelines(self) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(PipelineRun)
            .where(
                PipelineRun.status == PipelineRunStatus.FAILED,
                PipelineRun.deleted_at.is_(None),
            )
        )
        return int(result.scalar_one())

    async def pipeline_history(self) -> list[DashboardPipelineRun]:
        result = await self.session.execute(
            select(PipelineRun)
            .where(PipelineRun.deleted_at.is_(None))
            .order_by(PipelineRun.completed_at.desc().nullslast(), PipelineRun.created_at.desc())
            .limit(20)
        )
        return [
            DashboardPipelineRun(
                id=str(run.id),
                repository=run.repository,
                workflow_name=run.workflow_name,
                branch=run.branch,
                commit_sha=run.commit_sha,
                status=run.status.value,
                conclusion=run.conclusion,
                completed_at=run.completed_at,
            )
            for run in result.scalars().all()
        ]

    async def recent_failures(self) -> list[DashboardIncident]:
        result = await self.session.execute(
            select(Incident)
            .options(selectinload(Incident.pipeline_run))
            .where(Incident.deleted_at.is_(None))
            .order_by(Incident.created_at.desc())
            .limit(10)
        )
        incidents = result.scalars().all()
        return [
            DashboardIncident(
                id=str(incident.id),
                title=incident.title,
                severity=incident.severity.value,
                status=incident.status.value,
                repository=incident.pipeline_run.repository,
                workflow_name=incident.pipeline_run.workflow_name,
                created_at=incident.created_at,
            )
            for incident in incidents
        ]

    async def mttr_seconds(self) -> int:
        result = await self.session.execute(
            select(Incident)
            .options(selectinload(Incident.pipeline_run))
            .where(
                Incident.status == IncidentStatus.RESOLVED,
                Incident.deleted_at.is_(None),
            )
        )
        durations = []
        now = datetime.now(UTC)
        for incident in result.scalars().all():
            completed_at = incident.pipeline_run.completed_at or incident.pipeline_run.created_at
            durations.append(max(int((now - completed_at).total_seconds()), 0))
        if not durations:
            return 0
        return int(sum(durations) / len(durations))
