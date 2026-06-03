from app.models import Incident
from app.repositories.base import SQLAlchemyRepository


class IncidentRepository(SQLAlchemyRepository[Incident]):
    model = Incident
