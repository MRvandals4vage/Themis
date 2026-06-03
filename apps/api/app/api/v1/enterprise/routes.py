from uuid import UUID
from uuid import UUID as pyUUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_session
from app.models import Organization, Project, Repository, Team, TeamMember, User
from app.schemas.enterprise import (
    LinkRepositoryPayload,
    ProjectCreate,
    ProjectRead,
    TeamCreate,
    TeamMemberCreate,
    TeamMemberRead,
    TeamRead,
    UserRoleUpdate,
)

router = APIRouter()


async def resolve_org_id(org_id: str, session: AsyncSession) -> pyUUID:
    if org_id == "default":
        result = await session.execute(select(Organization).where(Organization.slug == "default"))
        org = result.scalar_one_or_none()
        if not org:
            org = Organization(name="Default Organization", slug="default")
            session.add(org)
            await session.flush()
        return org.id
    try:
        return pyUUID(org_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid organization ID format") from e


# 1. Teams Management
@router.get("/organizations/{org_id}/teams", response_model=list[TeamRead], status_code=200)
async def list_teams(org_id: str, session: AsyncSession = Depends(get_session)) -> list[TeamRead]:
    resolved_id = await resolve_org_id(org_id, session)
    result = await session.execute(
        select(Team).where(Team.organization_id == resolved_id, Team.deleted_at.is_(None))
    )
    return list(result.scalars().all())


@router.post("/organizations/{org_id}/teams", response_model=TeamRead, status_code=201)
async def create_team(
    org_id: str, payload: TeamCreate, session: AsyncSession = Depends(get_session)
) -> TeamRead:
    resolved_id = await resolve_org_id(org_id, session)
    team = Team(organization_id=resolved_id, name=payload.name)
    session.add(team)
    await session.commit()
    return team


@router.post(
    "/organizations/{org_id}/teams/{team_id}/members",
    response_model=TeamMemberRead,
    status_code=201,
)
async def add_team_member(
    org_id: str,
    team_id: UUID,
    payload: TeamMemberCreate,
    session: AsyncSession = Depends(get_session),
) -> TeamMemberRead:
    # Verify user exists
    user = await session.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    member = TeamMember(team_id=team_id, user_id=payload.user_id)
    session.add(member)
    await session.commit()
    return member


# 2. Projects Management
@router.get(
    "/organizations/{org_id}/projects",
    response_model=list[ProjectRead],
    status_code=200,
)
async def list_projects(
    org_id: str, session: AsyncSession = Depends(get_session)
) -> list[ProjectRead]:
    resolved_id = await resolve_org_id(org_id, session)
    result = await session.execute(
        select(Project).where(Project.organization_id == resolved_id, Project.deleted_at.is_(None))
    )
    return list(result.scalars().all())


@router.post("/organizations/{org_id}/projects", response_model=ProjectRead, status_code=201)
async def create_project(
    org_id: str, payload: ProjectCreate, session: AsyncSession = Depends(get_session)
) -> ProjectRead:
    resolved_id = await resolve_org_id(org_id, session)
    project = Project(
        organization_id=resolved_id,
        team_id=payload.team_id,
        name=payload.name,
        description=payload.description,
    )
    session.add(project)
    await session.commit()
    return project


@router.post("/organizations/{org_id}/projects/{project_id}/repositories", status_code=200)
async def link_repository_to_project(
    org_id: str,
    project_id: UUID,
    payload: LinkRepositoryPayload,
    session: AsyncSession = Depends(get_session),
) -> dict:
    repo = await session.get(Repository, payload.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo.project_id = project_id
    await session.commit()
    return {"message": f"Repository {repo.name} linked to project successfully"}


# 3. Roles and Permissions Management
@router.post("/users/{user_id}/role", status_code=200)
async def update_user_role(
    user_id: UUID, payload: UserRoleUpdate, session: AsyncSession = Depends(get_session)
) -> dict:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    await session.commit()
    return {"message": f"User role updated to {payload.role} successfully"}
