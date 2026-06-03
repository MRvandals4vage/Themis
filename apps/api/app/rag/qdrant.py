from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.core.config import settings


class OpenAIEmbeddingService:
    def __init__(self, api_key: str | None = None) -> None:
        key = api_key or settings.openai_api_key
        self.client = AsyncOpenAI(api_key=key if key else "dummy-key-for-testing")

    async def embed(self, text: str) -> list[float]:
        if not settings.openai_api_key and settings.environment == "local":
            normalized = min(len(text), 8192) / 8192
            return [normalized] * 1536
        try:
            response = await self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding
        except Exception:
            normalized = min(len(text), 8192) / 8192
            return [normalized] * 1536


class QdrantVectorSearchService:
    def __init__(self, client: AsyncQdrantClient) -> None:
        self.client = client

    async def ensure_collection(self, collection: str, vector_size: int = 1536) -> None:
        collections = await self.client.get_collections()
        existing = {item.name for item in collections.collections}
        if collection not in existing:
            await self.client.create_collection(
                collection_name=collection,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )

    async def upsert(
        self, collection: str, point_id: str, vector: list[float], payload: dict
    ) -> None:
        await self.ensure_collection(collection, len(vector))
        await self.client.upsert(
            collection_name=collection,
            points=[PointStruct(id=point_id, vector=vector, payload=payload)],
        )

    async def search(self, collection: str, vector: list[float], limit: int = 10) -> list[dict]:
        collections = await self.client.get_collections()
        existing = {item.name for item in collections.collections}
        if collection not in existing:
            return []
        points = await self.client.search(
            collection_name=collection, query_vector=vector, limit=limit
        )
        return [
            {"id": point.id, "score": point.score, "payload": point.payload or {}}
            for point in points
        ]


class DefaultRerankingService:
    async def rerank(self, query: str, documents: list[dict]) -> list[dict]:
        return sorted(documents, key=lambda item: item.get("score", 0), reverse=True)


class DefaultRetrievalService:
    def __init__(
        self,
        embedding_service: OpenAIEmbeddingService,
        vector_search_service: QdrantVectorSearchService,
        reranking_service: DefaultRerankingService,
    ) -> None:
        self.embedding_service = embedding_service
        self.vector_search_service = vector_search_service
        self.reranking_service = reranking_service

    async def retrieve(self, query: str, collection: str, limit: int = 10) -> list[dict]:
        vector = await self.embedding_service.embed(query)
        matches = await self.vector_search_service.search(collection, vector, limit)
        return await self.reranking_service.rerank(query, matches)
