import uuid

from qdrant_client import AsyncQdrantClient

from app.rag.qdrant import OpenAIEmbeddingService, QdrantVectorSearchService


class IncidentRAGService:
    def __init__(self, qdrant_client: AsyncQdrantClient) -> None:
        self.qdrant_client = qdrant_client
        self.embedding_service = OpenAIEmbeddingService()
        self.vector_search = QdrantVectorSearchService(qdrant_client)
        self.collection_name = "incidents"

    async def index_incident(
        self,
        incident_id: uuid.UUID,
        title: str,
        summary: str,
        root_cause: str,
        category: str,
        resolution: str = "",
        patch: str = "",
        outcome: str = "",
    ) -> None:
        """Embed and index a solved or analyzed incident failure log in Qdrant vector store."""
        content = (
            f"Title: {title}\nSummary: {summary}\n"
            f"Category: {category}\nRoot Cause: {root_cause}\n"
            f"Resolution: {resolution}"
        )
        vector = await self.embedding_service.embed(content)

        payload = {
            "incident_id": str(incident_id),
            "title": title,
            "summary": summary,
            "root_cause": root_cause,
            "category": category,
            "resolution": resolution,
            "patch": patch,
            "outcome": outcome,
        }

        point_id = str(incident_id)
        await self.vector_search.upsert(
            collection=self.collection_name,
            point_id=point_id,
            vector=vector,
            payload=payload,
        )

    async def retrieve_similar_incidents(self, log_text: str, limit: int = 3) -> list[dict]:
        """Search similar past incidents from the Qdrant store based on log text."""
        vector = await self.embedding_service.embed(log_text)
        results = await self.vector_search.search(
            collection=self.collection_name,
            vector=vector,
            limit=limit,
        )
        similar = []
        for res in results:
            payload = res.get("payload", {})
            # Only include relevant matches with good scores or simply return the matches
            similar.append(
                {
                    "incident_id": payload.get("incident_id"),
                    "title": payload.get("title"),
                    "root_cause": payload.get("root_cause"),
                    "category": payload.get("category"),
                    "resolution": payload.get("resolution", ""),
                    "patch": payload.get("patch", ""),
                    "outcome": payload.get("outcome", ""),
                    "score": res.get("score"),
                }
            )
        return similar
