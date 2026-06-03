from app.models import Repository
from app.repositories.base import SQLAlchemyRepository


class RepositoryRepository(SQLAlchemyRepository[Repository]):
    model = Repository
