from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.services.github_api import GitHubAPIService


@pytest.mark.asyncio
async def test_github_api_service_remediation() -> None:
    service = GitHubAPIService()
    incident = MagicMock()
    incident.id = uuid4()
    incident.pipeline_run = MagicMock()
    incident.pipeline_run.repository = "acme/api"

    result = await service.create_auto_remediation_pr(
        incident=incident, log_text="Docker build failed:\nModuleNotFoundError: dotenv"
    )

    assert result.success is True
    assert "dotenv" in result.branch_name or "auto-patch" in result.branch_name
    assert "python-dotenv==1.0.1" in result.patch_content
    assert result.pr_url == "https://github.com/acme/api/pull/42"
