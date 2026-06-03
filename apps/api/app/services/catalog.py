from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.pipelines import PipelineRepository
from app.repositories.repositories import RepositoryRepository
from app.repositories.users import UserRepository


class CatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self.users = UserRepository(session)
        self.repositories = RepositoryRepository(session)
        self.pipelines = PipelineRepository(session)
