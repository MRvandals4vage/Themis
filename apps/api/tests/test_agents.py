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
