from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.core.config import settings
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


@pytest.mark.asyncio
async def test_github_api_service_remediation_real_flow() -> None:
    with patch.object(settings, "github_token", "fake-github-token"):
        service = GitHubAPIService()
        incident = MagicMock()
        incident.id = uuid4()
        incident.pipeline_run = MagicMock()
        incident.pipeline_run.repository = "acme/api"
        incident.pipeline_run.branch = "main"

        mock_client = MagicMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock()
        mock_client.get = AsyncMock()
        mock_client.post = AsyncMock()
        mock_client.put = AsyncMock()

        mock_ref_res = MagicMock()
        mock_ref_res.status_code = 200
        mock_ref_res.json.return_value = {"object": {"sha": "base-sha-123"}}

        mock_branch_res = MagicMock()
        mock_branch_res.status_code = 201

        mock_content_res = MagicMock()
        mock_content_res.status_code = 200
        mock_content_res.json.return_value = {
            "sha": "file-sha-456",
            "content": "b2xkX2NvbnRlbnQ=",
        }

        mock_commit_res = MagicMock()
        mock_commit_res.status_code = 200

        mock_pr_res = MagicMock()
        mock_pr_res.status_code = 201
        mock_pr_res.json.return_value = {"html_url": "https://github.com/acme/api/pull/123"}

        mock_client.get.side_effect = [mock_ref_res, mock_content_res]
        mock_client.post.side_effect = [mock_branch_res, mock_pr_res]
        mock_client.put.return_value = mock_commit_res

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await service.create_auto_remediation_pr(
                incident=incident,
                log_text="Docker build failed:\nModuleNotFoundError: dotenv",
            )

        assert result.success is True
        assert result.pr_url == "https://github.com/acme/api/pull/123"
        assert "auto-patch" in result.branch_name
