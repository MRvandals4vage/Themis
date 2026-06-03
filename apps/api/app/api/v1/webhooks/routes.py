import json

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_session
from app.schemas.webhooks import WebhookIngestionResponse
from app.services.github_webhooks import GitHubWebhookService

router = APIRouter()


@router.post("/github", response_model=WebhookIngestionResponse)
async def github_webhook(
    request: Request,
    x_github_event: str = Header(alias="X-GitHub-Event"),
    x_hub_signature_256: str | None = Header(default=None, alias="X-Hub-Signature-256"),
    session: AsyncSession = Depends(get_session),
) -> WebhookIngestionResponse:
    body = await request.body()
    service = GitHubWebhookService(session)
    service.verify_signature(body, x_hub_signature_256)

    payload = json.loads(body.decode("utf-8"))
    pipeline_run, incident, reason = await service.ingest(x_github_event, payload)
    await session.commit()

    if incident and settings.enable_self_healing:
        import asyncio

        from qdrant_client import AsyncQdrantClient

        from app.db.session import AsyncSessionLocal
        from app.services.self_healing import SelfHealingService

        async def run_healing_bg(inc_id):
            async with AsyncSessionLocal() as bg_session:
                qdrant_client = AsyncQdrantClient(url=settings.qdrant_url)
                try:
                    await SelfHealingService(bg_session, qdrant_client).run_self_healing(inc_id)
                finally:
                    await qdrant_client.close()

        asyncio.create_task(run_healing_bg(incident.id))

    repository = payload.get("repository", {}).get("full_name")
    return WebhookIngestionResponse(
        accepted=reason is None,
        event=x_github_event,
        action=payload.get("action"),
        repository=repository,
        pipeline_run_id=str(pipeline_run.id) if pipeline_run else None,
        incident_id=str(incident.id) if incident else None,
        reason=reason,
    )
