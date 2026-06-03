from fastapi import APIRouter, Depends
from qdrant_client import AsyncQdrantClient
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_qdrant, get_redis, get_session

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "themis-api"}


@router.get("/health/database")
async def database_health(session: AsyncSession = Depends(get_session)) -> dict[str, str]:
    await session.execute(text("SELECT 1"))
    return {"status": "ok", "dependency": "postgres"}


@router.get("/health/redis")
async def redis_health(redis: Redis = Depends(get_redis)) -> dict[str, str]:
    await redis.ping()
    return {"status": "ok", "dependency": "redis"}


@router.get("/health/qdrant")
async def qdrant_health(qdrant: AsyncQdrantClient = Depends(get_qdrant)) -> dict[str, str]:
    await qdrant.get_collections()
    return {"status": "ok", "dependency": "qdrant"}
