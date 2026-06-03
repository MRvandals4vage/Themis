from langgraph.graph import END, StateGraph

from app.agents.implementations import (
    ClassifierAgent,
    FixRecommendationAgent,
    RAGRetrievalAgent,
    ReporterAgent,
    RootCauseAgent,
)
from app.agents.state import FailureAnalysisState


def build_failure_analysis_graph(qdrant_client=None) -> StateGraph:
    graph = StateGraph(FailureAnalysisState)
    graph.add_node("classifier", ClassifierAgent().run)
    graph.add_node("root_cause_agent", RootCauseAgent().run)
    graph.add_node("retriever", RAGRetrievalAgent(qdrant_client).run)
    graph.add_node("fix_recommendation", FixRecommendationAgent().run)
    graph.add_node("reporter", ReporterAgent().run)

    graph.set_entry_point("classifier")
    graph.add_edge("classifier", "root_cause_agent")
    graph.add_edge("root_cause_agent", "retriever")
    graph.add_edge("retriever", "fix_recommendation")
    graph.add_edge("fix_recommendation", "reporter")
    graph.add_edge("reporter", END)
    return graph
