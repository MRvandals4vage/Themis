from fastapi import APIRouter

from app.schemas.common import APIMessage

router = APIRouter()


@router.get("", response_model=APIMessage)
async def rag_index() -> APIMessage:
    return APIMessage(message="RAG service interfaces are registered with Qdrant adapters.")
