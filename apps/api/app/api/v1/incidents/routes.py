from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_session
from app.schemas.incidents import IncidentCreate, IncidentRead
from app.services.incidents import IncidentService

router = APIRouter()


@router.get("", response_model=list[IncidentRead])
async def list_incidents(session: AsyncSession = Depends(get_session)) -> list[IncidentRead]:
    return await IncidentService(session).list_incidents()


@router.post("", response_model=IncidentRead, status_code=201)
async def create_incident(
    payload: IncidentCreate, session: AsyncSession = Depends(get_session)
) -> IncidentRead:
    incident = await IncidentService(session).create_incident(payload)
    await session.commit()
    return incident
