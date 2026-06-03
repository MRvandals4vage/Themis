from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from app.core.config import settings


class LogAnalysisResult(BaseModel):
    category: str = Field(
        description="The high-level category of the failure (e.g. Dependency Error)."
    )
    root_cause: str = Field(description="The specific cause of the failure.")
    confidence: float = Field(description="Confidence score of the analysis between 0.0 and 1.0.")
    summary: str = Field(description="A concise summary of the build log and failure event.")


class LogAnalysisService:
    def __init__(self, api_key: str | None = None) -> None:
        key = api_key or settings.openai_api_key
        self.client = AsyncOpenAI(api_key=key if key else "dummy-key-for-testing")

    async def analyze_log(self, log_text: str) -> LogAnalysisResult:
        if not settings.openai_api_key and settings.environment == "local":
            # For local environment without API key, return a mock/fallback
            if "ModuleNotFoundError" in log_text and "dotenv" in log_text:
                return LogAnalysisResult(
                    category="Dependency Error",
                    root_cause="python-dotenv missing",
                    confidence=0.96,
                    summary=(
                        "Build failed due to missing dependency python-dotenv "
                        "during docker build."
                    ),
                )
            return LogAnalysisResult(
                category="Unknown Error",
                root_cause="Failed to parse logs automatically",
                confidence=0.5,
                summary="Build failed with unidentified errors.",
            )

        try:
            response = await self.client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert systems engineer and SRE helper. "
                            "Analyze the provided pipeline/build log snippet to determine:\n"
                            "1. The error category (e.g. Dependency Error, Test Failure, etc.).\n"
                            "2. The root cause (a concise explanation of what failed and why).\n"
                            "3. Your confidence score as a float between 0.0 and 1.0."
                        ),
                    },
                    {"role": "user", "content": log_text},
                ],
                response_format=LogAnalysisResult,
                temperature=0.0,
            )
            parsed = response.choices[0].message.parsed
            if parsed is None:
                raise ValueError("Failed to parse log analysis result from OpenAI")
            return parsed
        except Exception as e:
            # Fallback in case of API failure
            return LogAnalysisResult(
                category="Analysis Error",
                root_cause=f"AI log analysis failed: {str(e)}",
                confidence=0.0,
                summary="Log analysis failed with an exception.",
            )
