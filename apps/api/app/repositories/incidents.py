from app.models import Incident, IncidentAnalysis
from app.repositories.base import SQLAlchemyRepository


class IncidentRepository(SQLAlchemyRepository[Incident]):
    model = Incident

    async def get_by_pipeline_run_id(self, pipeline_run_id) -> Incident | None:
        from sqlalchemy import select

        result = await self.session.execute(
            select(Incident).where(
                Incident.pipeline_run_id == pipeline_run_id,
                Incident.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()


class IncidentAnalysisRepository(SQLAlchemyRepository[IncidentAnalysis]):
    model = IncidentAnalysis

    async def get_by_incident_id(self, incident_id) -> IncidentAnalysis | None:
        from sqlalchemy import select

        result = await self.session.execute(
            select(IncidentAnalysis).where(
                IncidentAnalysis.incident_id == incident_id,
                IncidentAnalysis.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
