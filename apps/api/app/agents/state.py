from typing import Any, TypedDict


class FailureAnalysisState(TypedDict, total=False):
    failure_event: dict[str, Any]
    classification: dict[str, Any]
    root_cause: dict[str, Any]
    retrieved_context: list[dict[str, Any]]
    recommendation: dict[str, Any]
    report: dict[str, Any]
