from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.rag import IncidentRAGService


@pytest.mark.asyncio
async def test_rag_indexing_and_search() -> None:
    mock_client = MagicMock()
    mock_client.get_collections = AsyncMock()
    mock_collection = MagicMock()
    mock_collection.name = "incidents"
    mock_client.get_collections.return_value = MagicMock(collections=[mock_collection])
    mock_client.create_collection = AsyncMock()
    mock_client.upsert = AsyncMock()

    mock_point = MagicMock()
    mock_point.id = "some-id"
    mock_point.score = 0.95
    mock_point.payload = {
        "incident_id": "test-id-123",
        "title": "Docker build failed",
        "root_cause": "python-dotenv missing",
        "category": "Dependency Error",
    }
    mock_client.search = AsyncMock(return_value=[mock_point])

    service = IncidentRAGService(mock_client)

    incident_id = uuid4()
    await service.index_incident(
        incident_id=incident_id,
        title="Test Build Fail",
        summary="ModuleNotFound: dotenv",
        root_cause="python-dotenv missing",
        category="Dependency Error",
    )

    assert mock_client.upsert.called

    results = await service.retrieve_similar_incidents("ModuleNotFound: dotenv", limit=3)
    assert len(results) == 1
    assert results[0]["title"] == "Docker build failed"
    assert results[0]["score"] == 0.95
