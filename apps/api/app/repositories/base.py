from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class SQLAlchemyRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def active_query(self) -> Select[tuple[ModelT]]:
        return select(self.model).where(self.model.deleted_at.is_(None))

    async def get(self, entity_id: UUID) -> ModelT | None:
        result = await self.session.execute(self.active_query().where(self.model.id == entity_id))
        return result.scalar_one_or_none()

    async def list(self, limit: int = 50, offset: int = 0) -> list[ModelT]:
        result = await self.session.execute(self.active_query().limit(limit).offset(offset))
        return list(result.scalars().all())

    async def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        await self.session.flush()
        return entity
