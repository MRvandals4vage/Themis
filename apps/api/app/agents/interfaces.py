from typing import Protocol

from app.agents.state import FailureAnalysisState


class AnalysisAgent(Protocol):
    name: str

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        """Execute one step in the incident analysis workflow."""
