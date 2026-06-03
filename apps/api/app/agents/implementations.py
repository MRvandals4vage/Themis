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
        root_cause = state.get("root_cause", {})
        log_text = state.get("failure_event", {}).get("logs", "")

        from app.core.config import settings

        if not settings.openai_api_key and settings.environment == "local":
            actions = []
            if retrieved:
                title = retrieved[0].get("title")
                actions.append(f"Remediate using similar past incident: {title}")
                actions.append(f"Past root cause was: {retrieved[0].get('root_cause')}")
            else:
                category = classification.get("category", "Unknown")
                actions.append(f"Investigate general {category} error.")
            state["recommendation"] = {"actions": actions, "risk": "medium"}
            return state

        from openai import AsyncOpenAI
        from pydantic import BaseModel, Field

        class FixRecommendationResult(BaseModel):
            actions: list[str] = Field(description="Actionable steps to resolve the issue.")
            risk: str = Field(description="Risk level of applying the recommendation.")

        context_str = ""
        if retrieved:
            context_str = "Here are similar past incidents that might help:\n"
            for i, item in enumerate(retrieved):
                context_str += (
                    f"--- Similar Incident #{i+1} ---\n"
                    f"Title: {item.get('title')}\n"
                    f"Category: {item.get('category')}\n"
                    f"Root Cause: {item.get('root_cause')}\n"
                    f"Resolution: {item.get('resolution')}\n"
                    f"Patch: {item.get('patch')}\n"
                    f"Outcome: {item.get('outcome')}\n\n"
                )

        prompt = (
            f"You are an SRE recommending remediation actions. "
            f"Analyze the current incident context and logs.\n\n"
            f"Current Incident logs: {log_text}\n"
            f"Current Incident category: {classification.get('category')}\n"
            f"Current Incident root cause: {root_cause.get('summary')}\n\n"
            f"{context_str}"
            f"Provide a list of actionable remediation steps ('actions') and "
            f"an assessment of 'risk' (low, medium, high)."
        )

        try:
            client = AsyncOpenAI(api_key=settings.openai_api_key)
            response = await client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional SRE recommending remediation actions.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format=FixRecommendationResult,
                temperature=0.0,
            )
            parsed = response.choices[0].message.parsed
            if parsed is None:
                raise ValueError("Failed to parse recommendation from OpenAI")
            state["recommendation"] = {
                "actions": parsed.actions,
                "risk": parsed.risk,
            }
        except Exception:
            category = classification.get("category", "Unknown")
            actions = [f"Investigate general {category} error."]
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
