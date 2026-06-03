from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import Project, Repository, Team, User
from app.models.enums import UserRole
from app.schemas.enterprise import FleetAnalyticsReport

client = TestClient(app)


@pytest.mark.asyncio
async def test_list_teams_route() -> None:
    mock_team = MagicMock(spec=Team)
    mock_team.id = uuid4()
    mock_team.organization_id = uuid4()
    mock_team.name = "Engineering Team"
    mock_team.created_at = "2026-06-03T10:00:00Z"

    mock_execute = MagicMock()
    mock_execute.scalars.return_value.all.return_value = [mock_team]

    # We mock resolve_org_id to prevent database dependency
    with (
        patch("app.api.v1.enterprise.routes.resolve_org_id", return_value=uuid4()),
        patch("app.api.v1.enterprise.routes.Depends", return_value=MagicMock()),
        patch("sqlalchemy.ext.asyncio.AsyncSession.execute", return_value=mock_execute),
    ):
        # Call list teams
        from app.api.v1.enterprise.routes import list_teams

        session = AsyncMock()
        session.execute.return_value = mock_execute
        res = await list_teams(org_id="default", session=session)
        assert len(res) == 1
        assert res[0].name == "Engineering Team"


@pytest.mark.asyncio
async def test_create_team_route() -> None:
    from app.schemas.enterprise import TeamCreate

    payload = TeamCreate(name="Security Team")

    with patch("app.api.v1.enterprise.routes.resolve_org_id", return_value=uuid4()):
        from app.api.v1.enterprise.routes import create_team

        session = AsyncMock()
        session.add = MagicMock()  # Keep add synchronous to prevent async mock warnings
        res = await create_team(org_id="default", payload=payload, session=session)
        assert res.name == "Security Team"
        session.add.assert_called_once()
        session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_list_projects_route() -> None:
    mock_proj = MagicMock(spec=Project)
    mock_proj.id = uuid4()
    mock_proj.organization_id = uuid4()
    mock_proj.team_id = uuid4()
    mock_proj.name = "Operations Panel"
    mock_proj.description = "Management dashboard project"
    mock_proj.created_at = "2026-06-03T10:00:00Z"

    mock_execute = MagicMock()
    mock_execute.scalars.return_value.all.return_value = [mock_proj]

    with patch("app.api.v1.enterprise.routes.resolve_org_id", return_value=uuid4()):
        from app.api.v1.enterprise.routes import list_projects

        session = AsyncMock()
        session.execute.return_value = mock_execute
        res = await list_projects(org_id="default", session=session)
        assert len(res) == 1
        assert res[0].name == "Operations Panel"


@pytest.mark.asyncio
async def test_update_user_role_route() -> None:
    mock_user = MagicMock(spec=User)
    mock_user.id = uuid4()
    mock_user.role = UserRole.VIEWER

    from app.schemas.enterprise import UserRoleUpdate

    payload = UserRoleUpdate(role=UserRole.ADMIN)

    session = AsyncMock()
    session.get.return_value = mock_user

    from app.api.v1.enterprise.routes import update_user_role

    res = await update_user_role(user_id=mock_user.id, payload=payload, session=session)
    assert res["message"] == "User role updated to admin successfully"
    assert mock_user.role == UserRole.ADMIN
    session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_fleet_analytics_dashboard_service() -> None:
    session = AsyncMock()

    # Mock Repository, Project, Incident, PipelineRun executes
    mock_repo = MagicMock(spec=Repository)
    mock_repo.id = uuid4()
    mock_repo.name = "acme/api"
    mock_repo.project = MagicMock(spec=Project)
    mock_repo.project.name = "API Project"
    mock_repo.project.team = MagicMock()
    mock_repo.project.team.name = "Engineering Team"

    mock_proj = MagicMock(spec=Project)
    mock_proj.id = uuid4()
    mock_proj.name = "API Project"
    mock_proj.repositories = [mock_repo]

    mock_repos_exec = MagicMock()
    mock_repos_exec.scalars.return_value.all.return_value = [mock_repo]

    mock_proj_exec = MagicMock()
    mock_proj_exec.scalars.return_value.all.return_value = [mock_proj]

    mock_empty_exec = MagicMock()
    mock_empty_exec.scalars.return_value.all.return_value = []

    session.execute.side_effect = [
        mock_repos_exec,  # repos query
        mock_proj_exec,  # projects query
        mock_empty_exec,  # active incidents query
        mock_empty_exec,  # all incidents query
        mock_empty_exec,  # pipeline runs query
    ]

    from app.services.dashboard import DashboardService

    service = DashboardService(session)

    # Mock mttr_seconds method to return 0
    service.mttr_seconds = AsyncMock(return_value=0)

    res = await service.get_fleet_analytics()

    assert isinstance(res, FleetAnalyticsReport)
    assert res.total_repositories == 1
    assert res.active_incidents == 0
    assert len(res.repositories) == 1
    assert res.repositories[0].name == "acme/api"
    assert res.repositories[0].project_name == "API Project"
    assert res.repositories[0].team_name == "Engineering Team"
