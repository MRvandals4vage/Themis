from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models import Incident, PipelineRun
from app.models.enums import IncidentStatus, PipelineRunStatus
from app.schemas.dashboard import DashboardIncident, DashboardPipelineRun, DashboardSummary
from app.schemas.enterprise import FleetAnalyticsReport, FleetRepositoryAnalytics, ProjectAnalytics


class DashboardService:
    """Service to handle fetching and calculating metrics for the dashboard."""

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

    async def get_fleet_analytics(self) -> FleetAnalyticsReport:
        from app.models import Incident, PipelineRun, Project, Repository
        from app.models.enums import IncidentStatus

        # 1. Fetch repositories with linked projects/teams
        repos_result = await self.session.execute(
            select(Repository)
            .options(joinedload(Repository.project).joinedload(Project.team))
            .where(Repository.deleted_at.is_(None))
        )
        repos = repos_result.scalars().all()

        # 2. Fetch projects
        projects_result = await self.session.execute(
            select(Project)
            .options(joinedload(Project.repositories))
            .where(Project.deleted_at.is_(None))
        )
        projects = projects_result.scalars().all()

        # 3. Fetch active incidents
        active_inc_res = await self.session.execute(
            select(Incident)
            .options(selectinload(Incident.pipeline_run))
            .where(
                Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING]),
                Incident.deleted_at.is_(None),
            )
        )
        active_incidents = active_inc_res.scalars().all()

        # Group active incidents by repository
        repo_active_count = {}
        for inc in active_incidents:
            repo_name = inc.pipeline_run.repository
            repo_active_count[repo_name] = repo_active_count.get(repo_name, 0) + 1

        # 4. Fetch all incidents to calculate MTTR
        all_inc_res = await self.session.execute(
            select(Incident)
            .options(selectinload(Incident.pipeline_run))
            .where(Incident.deleted_at.is_(None))
        )
        all_incidents = all_inc_res.scalars().all()

        # mttr per repository
        repo_mttr_data = {}
        repo_total_count = {}
        now = datetime.now(UTC)
        for inc in all_incidents:
            repo_name = inc.pipeline_run.repository
            repo_total_count[repo_name] = repo_total_count.get(repo_name, 0) + 1
            if inc.status == IncidentStatus.RESOLVED:
                completed = inc.pipeline_run.completed_at or inc.pipeline_run.created_at
                duration = max(int((now - completed).total_seconds()), 0)
                if repo_name not in repo_mttr_data:
                    repo_mttr_data[repo_name] = []
                repo_mttr_data[repo_name].append(duration)

        # 5. Pipeline runs to calculate project/repo failure rates
        runs_res = await self.session.execute(
            select(PipelineRun).where(PipelineRun.deleted_at.is_(None))
        )
        all_runs = runs_res.scalars().all()
        repo_runs_total = {}
        repo_runs_failed = {}
        for run in all_runs:
            repo_runs_total[run.repository] = repo_runs_total.get(run.repository, 0) + 1
            if run.status == PipelineRunStatus.FAILED:
                repo_runs_failed[run.repository] = repo_runs_failed.get(run.repository, 0) + 1

        # Calculate repo list
        repo_reports = []
        for r in repos:
            match_name = r.name
            active_count = 0
            total_count = 0
            durations = []
            for name, count in repo_active_count.items():
                if match_name in name:
                    active_count += count
            for name, count in repo_total_count.items():
                if match_name in name:
                    total_count += count
            for name, durs in repo_mttr_data.items():
                if match_name in name:
                    durations.extend(durs)

            mttr = int(sum(durations) / len(durations)) if durations else 0
            healthy = active_count == 0

            project_name = r.project.name if r.project else None
            team_name = r.project.team.name if (r.project and r.project.team) else None

            repo_reports.append(
                FleetRepositoryAnalytics(
                    id=r.id,
                    name=r.name,
                    healthy=healthy,
                    incident_count=total_count,
                    mttr_seconds=mttr,
                    project_name=project_name,
                    team_name=team_name,
                )
            )

        # Calculate projects list
        project_reports = []
        healthy_projects_count = 0
        for p in projects:
            p_total_runs = 0
            p_failed_runs = 0
            p_incidents = 0
            p_active_incidents = 0
            for r in p.repositories:
                match_name = r.name
                for name, count in repo_runs_total.items():
                    if match_name in name:
                        p_total_runs += count
                for name, count in repo_runs_failed.items():
                    if match_name in name:
                        p_failed_runs += count
                for name, count in repo_active_count.items():
                    if match_name in name:
                        p_active_incidents += count
                for name, count in repo_total_count.items():
                    if match_name in name:
                        p_incidents += count

            fail_rate = float(p_failed_runs) / p_total_runs if p_total_runs > 0 else 0.0
            health_score = max(100 - (p_active_incidents * 20), 0)
            if p_active_incidents == 0:
                healthy_projects_count += 1

            project_reports.append(
                ProjectAnalytics(
                    id=p.id,
                    name=p.name,
                    failure_rate=round(fail_rate, 2),
                    incident_count=p_incidents,
                    health_score=health_score,
                )
            )

        # Overall MTTR
        total_mttr = await self.mttr_seconds()

        return FleetAnalyticsReport(
            total_repositories=len(repos),
            active_incidents=len(active_incidents),
            mttr_seconds=total_mttr,
            healthy_projects=healthy_projects_count,
            repositories=repo_reports,
            projects=project_reports,
        )
