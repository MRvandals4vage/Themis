from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Incident
from app.models.enums import IncidentStatus
from app.repositories.incidents import IncidentRepository
from app.schemas.incidents import IncidentCreate


class IncidentService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = IncidentRepository(session)

    async def list_incidents(self) -> list[Incident]:
        return await self.repository.list()

    async def create_incident(self, payload: IncidentCreate) -> Incident:
        incident = Incident(status=IncidentStatus.OPEN, **payload.model_dump())
        return await self.repository.add(incident)
