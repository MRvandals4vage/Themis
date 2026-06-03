import pytest

from app.services.log_analysis import LogAnalysisService


@pytest.mark.asyncio
async def test_log_analysis_service_fallback() -> None:
    service = LogAnalysisService()
    result = await service.analyze_log("Docker build failed:\nModuleNotFoundError: dotenv")

    assert result.category == "Dependency Error"
    assert result.root_cause == "python-dotenv missing"
    assert result.confidence == 0.96


@pytest.mark.asyncio
async def test_log_analysis_service_unknown() -> None:
    service = LogAnalysisService()
    result = await service.analyze_log("Some weird compiling error on line 45")

    assert result.category == "Unknown Error"
    assert result.root_cause == "Failed to parse logs automatically"
    assert result.confidence == 0.5
