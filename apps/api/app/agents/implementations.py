from app.agents.state import FailureAnalysisState


class ClassifierAgent:
    name = "classifier"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        log_text = state.get("failure_event", {}).get("logs", "")
        from app.services.log_analysis import LogAnalysisService

        analysis_service = LogAnalysisService()
        result = await analysis_service.analyze_log(log_text)
        state["classification"] = {
            "category": result.category,
            "confidence": result.confidence,
            "summary": result.summary,
        }
        return state


class RootCauseAgent:
    name = "root_cause"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        log_text = state.get("failure_event", {}).get("logs", "")
        from app.services.log_analysis import LogAnalysisService

        analysis_service = LogAnalysisService()
        result = await analysis_service.analyze_log(log_text)
        state["root_cause"] = {"summary": result.root_cause, "signals": []}
        return state


class RAGRetrievalAgent:
    name = "rag_retrieval"

    def __init__(self, qdrant_client=None) -> None:
        self.qdrant_client = qdrant_client

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        log_text = state.get("failure_event", {}).get("logs", "")
        if self.qdrant_client:
            from app.services.rag import IncidentRAGService

            rag_service = IncidentRAGService(self.qdrant_client)
            similar = await rag_service.retrieve_similar_incidents(log_text)
            state["retrieved_context"] = similar
        else:
            state["retrieved_context"] = []
        return state


class FixRecommendationAgent:
    name = "fix_recommendation"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        classification = state.get("classification", {})
        retrieved = state.get("retrieved_context", [])
        actions = []
        if retrieved:
            actions.append(f"Remediate using similar past incident: {retrieved[0].get('title')}")
            actions.append(f"Past root cause was: {retrieved[0].get('root_cause')}")
        else:
            actions.append(
                f"Investigate general {classification.get('category', 'Unknown')} error."
            )
        state["recommendation"] = {"actions": actions, "risk": "medium"}
        return state


class ReporterAgent:
    name = "reporter"

    async def run(self, state: FailureAnalysisState) -> FailureAnalysisState:
        recommendation = state.get("recommendation", {})
        root_cause = state.get("root_cause", {})
        state["report"] = {
            "status": "completed",
            "sections": [
                {"title": "Summary", "content": root_cause.get("summary", "")},
                {
                    "title": "Recommendations",
                    "content": ", ".join(recommendation.get("actions", [])),
                },
            ],
        }
        return state
