from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from qdrant_client import AsyncQdrantClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_qdrant, get_session
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
from app.services.rag import IncidentRAGService

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
    qdrant: AsyncQdrantClient = Depends(get_qdrant),
) -> IncidentAnalysisResponse:
    incident_repo = IncidentRepository(session)
    incident = await incident_repo.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    logs_to_analyze = payload.logs
    if not logs_to_analyze:
        logs_to_analyze = incident.summary

    # RAG retrieve similar incidents
    rag_service = IncidentRAGService(qdrant)
    similar = await rag_service.retrieve_similar_incidents(logs_to_analyze, limit=3)

    # Analyze current log
    analysis_service = LogAnalysisService()
    result = await analysis_service.analyze_log(logs_to_analyze)

    analysis_repo = IncidentAnalysisRepository(session)
    existing_analysis = await analysis_repo.get_by_incident_id(incident_id)

    db_confidence = int(result.confidence * 100)

    # Calculate remediation actions using retrieved fixes
    remediation_actions = []
    if similar:
        remediation_actions.append(
            f"Similar past failures were categorized as: {similar[0].get('category')}"
        )
        remediation_actions.append(f"Root cause was: {similar[0].get('root_cause')}")
    else:
        remediation_actions.append("No similar past incidents found in knowledge store.")

    if existing_analysis:
        existing_analysis.category = result.category
        existing_analysis.root_cause = result.root_cause
        existing_analysis.confidence_score = db_confidence
        existing_analysis.similar_incidents = similar
        existing_analysis.remediation = {"actions": remediation_actions}
    else:
        new_analysis = IncidentAnalysis(
            incident_id=incident_id,
            category=result.category,
            root_cause=result.root_cause,
            confidence_score=db_confidence,
            similar_incidents=similar,
            remediation={"actions": remediation_actions},
        )
        await analysis_repo.add(new_analysis)

    await session.commit()

    # Index this failure in the vector store so future failures can match it
    await rag_service.index_incident(
        incident_id=incident_id,
        title=incident.title,
        summary=incident.summary,
        root_cause=result.root_cause,
        category=result.category,
    )

    return IncidentAnalysisResponse(
        category=result.category,
        root_cause=result.root_cause,
        confidence=result.confidence,
    )
