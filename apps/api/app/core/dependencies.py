from collections.abc import AsyncGenerator

from fastapi import Depends
from qdrant_client import AsyncQdrantClient
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db_session


async def get_session(session: AsyncSession = Depends(get_db_session)) -> AsyncSession:
    return session


async def get_redis() -> AsyncGenerator[Redis, None]:
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        yield client
    finally:
        await client.aclose()


async def get_qdrant() -> AsyncGenerator[AsyncQdrantClient, None]:
    client = AsyncQdrantClient(url=settings.qdrant_url)
    try:
        yield client
    finally:
        await client.close()
