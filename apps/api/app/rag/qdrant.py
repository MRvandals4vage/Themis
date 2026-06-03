from qdrant_client import AsyncQdrantClient


class OpenAIEmbeddingService:
    async def embed(self, text: str) -> list[float]:
        normalized = min(len(text), 8192) / 8192
        return [normalized] * 1536


class QdrantVectorSearchService:
    def __init__(self, client: AsyncQdrantClient) -> None:
        self.client = client

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
