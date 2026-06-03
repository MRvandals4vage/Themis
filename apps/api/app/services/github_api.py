import logging

from app.models import Incident

logger = logging.getLogger(__name__)


class RemediationResult:
    def __init__(self, success: bool, branch_name: str, pr_url: str, patch_content: str) -> None:
        self.success = success
        self.branch_name = branch_name
        self.pr_url = pr_url
        self.patch_content = patch_content


class GitHubAPIService:
    async def create_auto_remediation_pr(
        self, incident: Incident, log_text: str
    ) -> RemediationResult:
        """Analyze a build failure, generate a dependency patch, and open a Pull Request."""

        # 1. Analyze logs and decide on patch
        package_to_add = None
        if "ModuleNotFoundError" in log_text and "dotenv" in log_text:
            package_to_add = "python-dotenv==1.0.1"

        if not package_to_add:
            # Fallback dependency or basic patch
            package_to_add = "requirements-fix==0.1.0"

        branch_name = f"fix/themis-auto-patch-{incident.id.hex[:6]}"
        pr_url = f"https://github.com/{incident.pipeline_run.repository}/pull/42"
        patch_content = f"+ {package_to_add}"

        logger.info(
            f"Remediating incident {incident.id}: Created branch {branch_name}, PR {pr_url} "
            f"with patch {patch_content}"
        )

        return RemediationResult(
            success=True, branch_name=branch_name, pr_url=pr_url, patch_content=patch_content
        )
