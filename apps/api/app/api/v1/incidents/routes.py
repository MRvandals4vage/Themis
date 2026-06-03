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
    IncidentSearchMatch,
    IncidentSearchRequest,
    RemediationResponse,
)
from app.services.github_api import GitHubAPIService
from app.services.incidents import IncidentService
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

    # Run LangGraph pipeline
    from copy import deepcopy

    from app.agents.workflow import build_failure_analysis_graph
    from app.models import AgentExecution
    from app.models.enums import AgentExecutionStatus

    graph = build_failure_analysis_graph(qdrant).compile()
    initial_state = {"failure_event": {"logs": logs_to_analyze}}

    current_state = deepcopy(initial_state)

    async for chunk in graph.astream(initial_state):
        for node_name, updated_state in chunk.items():
            execution = AgentExecution(
                incident_id=incident_id,
                agent_name=node_name,
                status=AgentExecutionStatus.SUCCEEDED,
                input_payload={"state_before": deepcopy(current_state)},
                output_payload=deepcopy(updated_state),
            )
            session.add(execution)
            current_state.update(updated_state)

    # Extract final results from the graph state
    category = current_state.get("classification", {}).get("category", "Unknown Error")
    confidence = current_state.get("classification", {}).get("confidence", 0.5)
    root_cause = current_state.get("root_cause", {}).get(
        "summary", "Failed to parse logs automatically"
    )
    similar = current_state.get("retrieved_context", [])
    remediation_actions = current_state.get("recommendation", {}).get("actions", [])

    analysis_repo = IncidentAnalysisRepository(session)
    existing_analysis = await analysis_repo.get_by_incident_id(incident_id)

    db_confidence = int(confidence * 100)

    if existing_analysis:
        existing_analysis.category = category
        existing_analysis.root_cause = root_cause
        existing_analysis.confidence_score = db_confidence
        existing_analysis.similar_incidents = similar
        existing_analysis.remediation = {"actions": remediation_actions}
    else:
        new_analysis = IncidentAnalysis(
            incident_id=incident_id,
            category=category,
            root_cause=root_cause,
            confidence_score=db_confidence,
            similar_incidents=similar,
            remediation={"actions": remediation_actions},
        )
        await analysis_repo.add(new_analysis)

    await session.commit()

    # Index this failure in the vector store so future failures can match it
    rag_service = IncidentRAGService(qdrant)
    await rag_service.index_incident(
        incident_id=incident_id,
        title=incident.title,
        summary=incident.summary,
        root_cause=root_cause,
        category=category,
    )

    return IncidentAnalysisResponse(
        category=category,
        root_cause=root_cause,
        confidence=confidence,
    )


@router.post("/{incident_id}/remediate", response_model=RemediationResponse, status_code=200)
async def remediate_incident(
    incident_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> RemediationResponse:
    incident_repo = IncidentRepository(session)
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    result = await session.execute(
        select(incident_repo.model)
        .options(selectinload(incident_repo.model.pipeline_run))
        .where(incident_repo.model.id == incident_id, incident_repo.model.deleted_at.is_(None))
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    github_api = GitHubAPIService()
    res = await github_api.create_auto_remediation_pr(incident, incident.summary)

    return RemediationResponse(
        success=res.success,
        branch_name=res.branch_name,
        pr_url=res.pr_url,
        patch_content=res.patch_content,
    )


@router.post("/search", response_model=list[IncidentSearchMatch], status_code=200)
async def search_similar_incidents(
    payload: IncidentSearchRequest,
    qdrant: AsyncQdrantClient = Depends(get_qdrant),
) -> list[IncidentSearchMatch]:
    rag_service = IncidentRAGService(qdrant)
    matches = await rag_service.retrieve_similar_incidents(payload.query, limit=payload.limit)
    return [IncidentSearchMatch(**m) for m in matches]
