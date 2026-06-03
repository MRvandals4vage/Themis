from fastapi import APIRouter

from app.agents.workflow import build_failure_analysis_graph

router = APIRouter()


@router.get("/workflow")
async def workflow_shape() -> dict[str, list[str]]:
    graph = build_failure_analysis_graph()
    return {"nodes": list(graph.nodes)}
