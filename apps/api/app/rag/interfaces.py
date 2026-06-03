from typing import Protocol


class EmbeddingService(Protocol):
    async def embed(self, text: str) -> list[float]:
        """Create an embedding vector for text."""


class VectorSearchService(Protocol):
    async def search(self, collection: str, vector: list[float], limit: int = 10) -> list[dict]:
        """Search a vector index and return scored matches."""


class RetrievalService(Protocol):
    async def retrieve(self, query: str, collection: str, limit: int = 10) -> list[dict]:
        """Retrieve context records for a query."""


class RerankingService(Protocol):
    async def rerank(self, query: str, documents: list[dict]) -> list[dict]:
        """Reorder retrieved documents by relevance."""
