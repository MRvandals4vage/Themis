from pydantic import BaseModel


class WebhookIngestionResponse(BaseModel):
    accepted: bool
    event: str
    action: str | None = None
    repository: str | None = None
    pipeline_run_id: str | None = None
    incident_id: str | None = None
    reason: str | None = None
