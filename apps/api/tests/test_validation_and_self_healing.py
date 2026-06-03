from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models import Incident
from app.schemas.incidents import ValidationReport
from app.services.patch_validation import PatchValidationService
from app.services.self_healing import SelfHealingService


@pytest.mark.asyncio
async def test_patch_validation_service_success() -> None:
    service = PatchValidationService()
    incident = MagicMock(spec=Incident)
    incident.id = uuid4()

    # We test using a valid module like sys or dotenv (installed in test env)
    patch_content = "+ python-dotenv==1.0.1"

    result = await service.validate_patch(incident, patch_content)

    assert isinstance(result, ValidationReport)
    assert result.linter_passed is True
    assert result.tests_passed is True
    assert result.risk_level == "low"
    assert "low risk" in result.risk_assessment.lower()


@pytest.mark.asyncio
async def test_patch_validation_service_failure() -> None:
    service = PatchValidationService()
    incident = MagicMock(spec=Incident)
    incident.id = uuid4()

    # Test with a nonexistent package to trigger test failure
    patch_content = "+ non-existent-package==12.3.4"

    result = await service.validate_patch(incident, patch_content)

    assert isinstance(result, ValidationReport)
    assert result.tests_passed is False
    assert result.risk_level == "high"
    assert "high risk" in result.risk_assessment.lower()


@pytest.mark.asyncio
async def test_self_healing_workflow_success() -> None:
    session = AsyncMock()
    session.add = MagicMock()  # Keep add synchronous to prevent async mock coroutine warnings
    qdrant = MagicMock()

    # Mock Incident and PipelineRun
    incident = MagicMock()
    incident.id = uuid4()
    incident.title = "Test Failure"
    incident.summary = "ModuleNotFoundError: dotenv"
    incident.pipeline_run = MagicMock()

    # Setup mock session execute to return the incident
    mock_execute_result = MagicMock()
    mock_execute_result.scalar_one_or_none.return_value = incident
    session.execute.return_value = mock_execute_result

    # Mock analysis graph executions

    mock_bgraph = "app.services.self_healing.build_failure_analysis_graph"
    mock_irepo = "app.services.self_healing.IncidentAnalysisRepository"
    mock_irag = "app.services.self_healing.IncidentRAGService"
    mock_igithub = "app.services.self_healing.GitHubAPIService"
    mock_ival = "app.services.self_healing.PatchValidationService"

    with (
        patch(mock_bgraph) as mock_build_graph,
        patch(mock_irepo) as mock_analysis_repo_class,
        patch(mock_irag) as mock_rag_service_class,
        patch(mock_igithub) as mock_github_api_class,
        patch(mock_ival) as mock_val_service_class,
    ):
        # Mock repository methods
        mock_analysis_repo = mock_analysis_repo_class.return_value
        mock_analysis_repo.get_by_incident_id = AsyncMock(return_value=None)
        mock_analysis_repo.add = AsyncMock()

        # Mock RAG service index_incident method
        mock_rag_service_class.return_value.index_incident = AsyncMock()

        # Mock validation service
        mock_val = MagicMock(spec=ValidationReport)
        mock_val.risk_level = "low"
        mock_val.risk_assessment = "Low risk"
        mock_val.linter_passed = True
        mock_val.tests_passed = True
        mock_val_service_class.return_value.validate_patch = AsyncMock(return_value=mock_val)

        # Mock graph.astream
        mock_graph = MagicMock()

        async def mock_astream(*args, **kwargs):
            yield {
                "classifier": {
                    "classification": {"category": "Dependency Error", "confidence": 0.9}
                }
            }
            yield {"root_cause_agent": {"root_cause": {"summary": "python-dotenv missing"}}}
            yield {"retriever": {"retrieved_context": []}}
            yield {"fix_generator": {"recommendation": {"actions": ["Add python-dotenv"]}}}

        mock_graph.astream = mock_astream
        mock_build_graph.return_value.compile.return_value = mock_graph

        # Mock PR generation
        mock_github_api = MagicMock()
        mock_pr_res = MagicMock()
        mock_pr_res.success = True
        mock_pr_res.pr_url = "https://github.com/acme/api/pull/42"
        mock_github_api.create_auto_remediation_pr = AsyncMock(return_value=mock_pr_res)
        mock_github_api_class.return_value = mock_github_api

        service = SelfHealingService(session, qdrant)
        response = await service.run_self_healing(incident.id)

        assert response.success is True
        assert response.pr_url == "https://github.com/acme/api/pull/42"
        assert len(response.stages) == 6
        assert response.stages[4].name == "pr"
        assert response.stages[4].status == "success"
        assert response.stages[5].name == "retest"
        assert response.stages[5].status == "success"
