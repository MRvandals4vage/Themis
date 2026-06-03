import hashlib
import hmac

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.models.enums import IncidentSeverity, PipelineRunStatus
from app.services.github_webhooks import GitHubWebhookService


def workflow_payload(name: str = "Deploy Production", conclusion: str = "failure") -> dict:
    return {
        "action": "completed",
        "repository": {
            "id": 42,
            "full_name": "acme/api",
            "html_url": "https://github.com/acme/api",
            "default_branch": "main",
        },
        "workflow_run": {
            "id": 1001,
            "workflow_id": 777,
            "name": name,
            "head_branch": "main",
            "head_sha": "abc123",
            "status": "completed",
            "conclusion": conclusion,
            "run_started_at": "2026-06-03T10:00:00Z",
            "updated_at": "2026-06-03T10:04:00Z",
        },
    }


def test_signature_validation_accepts_valid_hmac() -> None:
    body = b'{"ok": true}'
    signature = hmac.new(
        settings.github_webhook_secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()
    service = GitHubWebhookService(session=None)  # type: ignore[arg-type]

    service.verify_signature(body, f"sha256={signature}")


def test_signature_validation_rejects_invalid_hmac() -> None:
    service = GitHubWebhookService(session=None)  # type: ignore[arg-type]

    with pytest.raises(HTTPException):
        service.verify_signature(b"{}", "sha256=invalid")


def test_workflow_run_normalization_is_provider_agnostic_shape() -> None:
    normalized = GitHubWebhookService(session=None).normalize_workflow_run(  # type: ignore[arg-type]
        workflow_payload()
    )

    assert normalized.repository == "acme/api"
    assert normalized.workflow_name == "Deploy Production"
    assert normalized.branch == "main"
    assert normalized.commit_sha == "abc123"
    assert normalized.status == PipelineRunStatus.FAILED
    assert normalized.conclusion == "failure"


@pytest.mark.parametrize(
    ("workflow_name", "severity"),
    [
        ("Deploy Production", IncidentSeverity.HIGH),
        ("Unit Tests", IncidentSeverity.MEDIUM),
        ("Lint", IncidentSeverity.LOW),
    ],
)
def test_incident_severity_classification(workflow_name: str, severity: IncidentSeverity) -> None:
    service = GitHubWebhookService(session=None)  # type: ignore[arg-type]
    normalized = service.normalize_workflow_run(workflow_payload(name=workflow_name))

    assert service.classify_severity(normalized) == severity
