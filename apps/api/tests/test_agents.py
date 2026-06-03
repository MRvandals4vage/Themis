from unittest.mock import AsyncMock, MagicMock

import pytest

from app.agents.workflow import build_failure_analysis_graph


@pytest.mark.asyncio
async def test_agent_graph_execution() -> None:
    # Mock Qdrant client
    mock_qdrant = MagicMock()
    mock_qdrant.get_collections = AsyncMock()
    mock_collection = MagicMock()
    mock_collection.name = "incidents"
    mock_qdrant.get_collections.return_value = MagicMock(collections=[mock_collection])
    mock_qdrant.search = AsyncMock(return_value=[])

    graph = build_failure_analysis_graph(mock_qdrant).compile()

    initial_state = {"failure_event": {"logs": "Docker build failed:\nModuleNotFoundError: dotenv"}}

    final_state = await graph.ainvoke(initial_state)

    assert final_state["classification"]["category"] == "Dependency Error"
    assert final_state["classification"]["confidence"] == 0.96
    assert final_state["classification"]["summary"] == (
        "Build failed due to missing dependency python-dotenv " "during docker build."
    )
    assert final_state["root_cause"]["summary"] == "python-dotenv missing"
    assert final_state["recommendation"]["actions"] == [
        "Investigate general Dependency Error error."
    ]
    assert final_state["report"]["status"] == "completed"


@pytest.mark.asyncio
async def test_agent_graph_execution_with_retrieved_context() -> None:
    # Mock Qdrant client with returned matching points
    mock_qdrant = MagicMock()
    mock_qdrant.get_collections = AsyncMock()
    mock_collection = MagicMock()
    mock_collection.name = "incidents"
    mock_qdrant.get_collections.return_value = MagicMock(collections=[mock_collection])

    mock_point = MagicMock()
    mock_point.id = "some-id"
    mock_point.score = 0.98
    mock_point.payload = {
        "incident_id": "past-incident-uuid",
        "title": "Old dotenv failure",
        "root_cause": "dotenv package was missing",
        "category": "Dependency Error",
        "resolution": "Install python-dotenv",
        "patch": "+ python-dotenv",
        "outcome": "resolved",
    }
    mock_qdrant.search = AsyncMock(return_value=[mock_point])

    graph = build_failure_analysis_graph(mock_qdrant).compile()
    initial_state = {"failure_event": {"logs": "Docker build failed:\nModuleNotFoundError: dotenv"}}

    final_state = await graph.ainvoke(initial_state)

    assert len(final_state["retrieved_context"]) == 1
    assert final_state["retrieved_context"][0]["title"] == "Old dotenv failure"
    assert "Old dotenv failure" in final_state["recommendation"]["actions"][0]
    assert "dotenv package was missing" in final_state["recommendation"]["actions"][1]
