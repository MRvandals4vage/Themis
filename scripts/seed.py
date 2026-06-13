import asyncio
import sys
from datetime import datetime, timedelta, UTC
from uuid import uuid4

# Add apps/api to path so we can import app modules
sys.path.append("apps/api")

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import (
    Organization, User, Team, Project, Repository,
    Pipeline, PipelineRun, Incident, IncidentAnalysis, AgentExecution
)
from app.models.enums import (
    UserRole, PipelineProvider, PipelineRunStatus,
    IncidentSeverity, IncidentStatus, AgentExecutionStatus
)

async def seed_data():
    async with AsyncSessionLocal() as session:
        # Check if organization already seeded
        result = await session.execute(select(Organization).where(Organization.slug == "default"))
        existing_org = result.scalar_one_or_none()
        if existing_org:
            print("Database already seeded.")
            return

        print("Seeding database...")

        # 1. Create Organization
        org = Organization(
            id=uuid4(),
            name="Themis Enterprise",
            slug="default"
        )
        session.add(org)
        await session.flush()

        # 2. Create User
        user = User(
            id=uuid4(),
            organization_id=org.id,
            email="admin@themis.ai",
            full_name="John Doe",
            password_hash="pbkdf2:sha256:600000$local$devpass",  # dummy dev hash
            role=UserRole.OWNER,
            is_active=True
        )
        session.add(user)

        # 3. Create Teams
        team_backend = Team(id=uuid4(), organization_id=org.id, name="Backend Team")
        team_data = Team(id=uuid4(), organization_id=org.id, name="Core Data Team")
        team_devops = Team(id=uuid4(), organization_id=org.id, name="DevOps Team")
        session.add_all([team_backend, team_data, team_devops])
        await session.flush()

        # 4. Create Projects
        proj_fintech = Project(
            id=uuid4(),
            organization_id=org.id,
            team_id=team_backend.id,
            name="Fintech Core",
            description="High-throughput payment gateway and finance modules."
        )
        proj_identity = Project(
            id=uuid4(),
            organization_id=org.id,
            team_id=team_data.id,
            name="Identity Platform",
            description="User profile database and security systems."
        )
        proj_messaging = Project(
            id=uuid4(),
            organization_id=org.id,
            team_id=team_backend.id,
            name="Messaging Platform",
            description="Notifications, webhook dispatches, and emails."
        )
        session.add_all([proj_fintech, proj_identity, proj_messaging])
        await session.flush()

        # 5. Create Repositories
        repo_payment = Repository(
            id=uuid4(),
            organization_id=org.id,
            project_id=proj_fintech.id,
            provider=PipelineProvider.GITHUB_ACTIONS,
            external_id="repo-1",
            name="payment-gateway",
            url="https://github.com/themis-ai/payment-gateway",
            default_branch="main"
        )
        repo_profile = Repository(
            id=uuid4(),
            organization_id=org.id,
            project_id=proj_identity.id,
            provider=PipelineProvider.GITHUB_ACTIONS,
            external_id="repo-2",
            name="user-profile-db",
            url="https://github.com/themis-ai/user-profile-db",
            default_branch="main"
        )
        repo_notification = Repository(
            id=uuid4(),
            organization_id=org.id,
            project_id=proj_messaging.id,
            provider=PipelineProvider.GITHUB_ACTIONS,
            external_id="repo-3",
            name="notification-service",
            url="https://github.com/themis-ai/notification-service",
            default_branch="main"
        )
        session.add_all([repo_payment, repo_profile, repo_notification])
        await session.flush()

        # 6. Create Pipelines
        pipe_pay_deploy = Pipeline(
            id=uuid4(),
            repository_id=repo_payment.id,
            name="deploy-production",
            provider=PipelineProvider.GITHUB_ACTIONS,
            external_id="workflow-pay-1",
            config_path=".github/workflows/deploy-production.yml"
        )
        pipe_prof_test = Pipeline(
            id=uuid4(),
            repository_id=repo_profile.id,
            name="test-suites",
            provider=PipelineProvider.GITHUB_ACTIONS,
            external_id="workflow-prof-1",
            config_path=".github/workflows/test-suites.yml"
        )
        pipe_notif_api = Pipeline(
            id=uuid4(),
            repository_id=repo_notification.id,
            name="api-test",
            provider=PipelineProvider.GITHUB_ACTIONS,
            external_id="workflow-notif-1",
            config_path=".github/workflows/api-test.yml"
        )
        session.add_all([pipe_pay_deploy, pipe_prof_test, pipe_notif_api])
        await session.flush()

        # 7. Create Pipeline Runs & Incidents
        # Incident 1 (Critical, Active): Database Connection Timeout
        run_1 = PipelineRun(
            id=uuid4(),
            pipeline_id=pipe_pay_deploy.id,
            provider=PipelineProvider.GITHUB_ACTIONS,
            repository="payment-gateway",
            workflow_name="deploy-production",
            external_id="run-pay-101",
            branch="main",
            commit_sha="af7d82cc6898d9e11ad788390b1c098dfa6ef8ee",
            status=PipelineRunStatus.FAILED,
            conclusion="failure",
            started_at=datetime.now(UTC) - timedelta(minutes=45),
            completed_at=datetime.now(UTC) - timedelta(minutes=30),
            finished_at=datetime.now(UTC) - timedelta(minutes=30),
            logs_url="https://github.com/themis-ai/payment-gateway/actions/runs/101/logs",
            raw_payload={"triggered_by": "admin"}
        )
        session.add(run_1)
        await session.flush()

        inc_1 = Incident(
            id=uuid4(),
            pipeline_run_id=run_1.id,
            title="Database Connection Timeout in us-east-1",
            summary="Application failed to connect to Postgres instances after deployment. Error trace indicates Connection Pool Timeout Exception.",
            severity=IncidentSeverity.CRITICAL,
            status=IncidentStatus.OPEN
        )
        session.add(inc_1)
        await session.flush()

        # Add Incident 1 analysis & agent executions
        analysis_1 = IncidentAnalysis(
            id=uuid4(),
            incident_id=inc_1.id,
            category="Database Connection Error",
            root_cause="Excessive connection pooling exhaustion caused by missing index on billing transaction queries.",
            confidence_score=96,
            similar_incidents=[
                {
                    "title": "Staging Pool Exhaustion on Postgres",
                    "score": 0.88,
                    "category": "Database Error",
                    "root_cause": "Billing ledger missing index on user_id.",
                    "resolution": "Added migration to create btree index.",
                    "outcome": "Resolved"
                }
            ],
            remediation={
                "actions": [
                    "Create missing btree index on billing transaction table (user_id).",
                    "Adjust pgpool connection pool size settings to maximum 150."
                ]
            }
        )
        session.add(analysis_1)

        exec_1_class = AgentExecution(
            id=uuid4(),
            incident_id=inc_1.id,
            agent_name="classifier",
            status=AgentExecutionStatus.SUCCEEDED,
            input_payload={"state_before": {"failure_event": {"logs": run_1.logs_url}}},
            output_payload={"classification": {"category": "Database Connection Error", "confidence": 0.96, "summary": "DB pool timeout"}}
        )
        exec_1_rc = AgentExecution(
            id=uuid4(),
            incident_id=inc_1.id,
            agent_name="root_cause_agent",
            status=AgentExecutionStatus.SUCCEEDED,
            input_payload={"state_before": {}},
            output_payload={"root_cause": {"summary": "Excessive connection pooling exhaustion caused by missing index on billing transaction queries."}}
        )
        session.add_all([exec_1_class, exec_1_rc])

        # Incident 2 (Medium, Investigating): Auth Service Latency Spike
        run_2 = PipelineRun(
            id=uuid4(),
            pipeline_id=pipe_notif_api.id,
            provider=PipelineProvider.GITHUB_ACTIONS,
            repository="notification-service",
            workflow_name="api-test",
            external_id="run-notif-202",
            branch="main",
            commit_sha="b78deac9b87df88e9981882c0cda91bc09a65cf2",
            status=PipelineRunStatus.FAILED,
            conclusion="failure",
            started_at=datetime.now(UTC) - timedelta(minutes=15),
            completed_at=datetime.now(UTC) - timedelta(minutes=10),
            finished_at=datetime.now(UTC) - timedelta(minutes=10),
            logs_url="https://github.com/themis-ai/notification-service/actions/runs/202/logs",
            raw_payload={"triggered_by": "developer"}
        )
        session.add(run_2)
        await session.flush()

        inc_2 = Incident(
            id=uuid4(),
            pipeline_run_id=run_2.id,
            title="Auth-Service Latency Spike",
            summary="HTTP latency increased beyond 5000ms threshold during integration tests for JWT auth service.",
            severity=IncidentSeverity.MEDIUM,
            status=IncidentStatus.INVESTIGATING
        )
        session.add(inc_2)
        await session.flush()

        # Add Incident 2 analysis & agent executions
        analysis_2 = IncidentAnalysis(
            id=uuid4(),
            incident_id=inc_2.id,
            category="Latency spike",
            root_cause="Rate limiting rules blocking verification service requests.",
            confidence_score=85,
            similar_incidents=[],
            remediation={
                "actions": [
                    "Increase endpoint rate limits or whitelist auth service internal IP addresses."
                ]
            }
        )
        session.add(analysis_2)

        exec_2_class = AgentExecution(
            id=uuid4(),
            incident_id=inc_2.id,
            agent_name="classifier",
            status=AgentExecutionStatus.SUCCEEDED,
            input_payload={"state_before": {}},
            output_payload={"classification": {"category": "Latency spike", "confidence": 0.85, "summary": "Spike in API latency"}}
        )
        session.add(exec_2_class)

        await session.commit()
        print("Data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
