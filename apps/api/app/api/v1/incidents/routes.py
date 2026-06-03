from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_session
from app.models import IncidentAnalysis
from app.repositories.incidents import IncidentAnalysisRepository, IncidentRepository
from app.schemas.incidents import (
    IncidentAnalysisRequest,
    IncidentAnalysisResponse,
    IncidentCreate,
    IncidentRead,
)
from app.services.incidents import IncidentService
from app.services.log_analysis import LogAnalysisService

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


@router.post("/{incident_id}/analyze", response_model=IncidentAnalysisResponse, status_code=200)
async def analyze_incident(
    incident_id: UUID,
    payload: IncidentAnalysisRequest,
    session: AsyncSession = Depends(get_session),
) -> IncidentAnalysisResponse:
    incident_repo = IncidentRepository(session)
    incident = await incident_repo.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    logs_to_analyze = payload.logs
    if not logs_to_analyze:
        logs_to_analyze = incident.summary

    analysis_service = LogAnalysisService()
    result = await analysis_service.analyze_log(logs_to_analyze)

    analysis_repo = IncidentAnalysisRepository(session)
    existing_analysis = await analysis_repo.get_by_incident_id(incident_id)

    db_confidence = int(result.confidence * 100)

    if existing_analysis:
        existing_analysis.category = result.category
        existing_analysis.root_cause = result.root_cause
        existing_analysis.confidence_score = db_confidence
    else:
        new_analysis = IncidentAnalysis(
            incident_id=incident_id,
            category=result.category,
            root_cause=result.root_cause,
            confidence_score=db_confidence,
            similar_incidents=[],
            remediation={},
        )
        await analysis_repo.add(new_analysis)

    await session.commit()

    return IncidentAnalysisResponse(
        category=result.category,
        root_cause=result.root_cause,
        confidence=result.confidence,
    )
