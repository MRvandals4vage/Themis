from app.agents.state import FailureAnalysisState


class ClassifierAgent:
    name = "classifier"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        state["classification"] = {"category": "unknown", "confidence": 0}
        return state


class RootCauseAgent:
    name = "root_cause"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        state["root_cause"] = {"summary": "Analysis pending", "signals": []}
        return state


class RAGRetrievalAgent:
    name = "rag_retrieval"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        state["retrieved_context"] = []
        return state


class FixRecommendationAgent:
    name = "fix_recommendation"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        state["recommendation"] = {"actions": [], "risk": "unknown"}
        return state


class ReporterAgent:
    name = "reporter"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        state["report"] = {"status": "draft", "sections": []}
        return state
