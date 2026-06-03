import base64
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.models import Incident
from app.services.patch_validation import PatchValidationService

logger = logging.getLogger(__name__)


class RemediationResult:
    def __init__(
        self,
        success: bool,
        branch_name: str,
        pr_url: str,
        patch_content: str,
        validation: Any = None,
    ) -> None:
        self.success = success
        self.branch_name = branch_name
        self.pr_url = pr_url
        self.patch_content = patch_content
        self.validation = validation


class GitHubAPIService:
    async def create_auto_remediation_pr(
        self, incident: Incident, log_text: str
    ) -> RemediationResult:
        """Analyze a build failure, generate a dependency patch, and open a Pull Request."""

        package_to_add = None
        if "ModuleNotFoundError" in log_text and "dotenv" in log_text:
            package_to_add = "python-dotenv==1.0.1"

        if not package_to_add:
            package_to_add = "requirements-fix==0.1.0"

        branch_name = f"fix/themis-auto-patch-{incident.id.hex[:6]}"
        patch_content = f"+ {package_to_add}"

        # B2: Execute Sandbox Patch Validation Engine
        validation_service = PatchValidationService()
        validation = await validation_service.validate_patch(incident, patch_content)

        if validation.risk_level == "high":
            logger.warning(
                f"Patch validation failed or returned high risk for incident {incident.id}. "
                "Aborting Pull Request creation."
            )
            return RemediationResult(
                success=False,
                branch_name="",
                pr_url="",
                patch_content=patch_content,
                validation=validation,
            )

        # If token is not set, use local simulated flow
        if not settings.github_token:
            repo = incident.pipeline_run.repository
            pr_url = f"https://github.com/{repo}/pull/42"
            logger.info(
                f"Remediating incident {incident.id}: Created branch {branch_name}, PR {pr_url} "
                f"with patch {patch_content} (Simulated)"
            )
            return RemediationResult(
                success=True,
                branch_name=branch_name,
                pr_url=pr_url,
                patch_content=patch_content,
                validation=validation,
            )

        repository = incident.pipeline_run.repository
        base_branch = incident.pipeline_run.branch or "main"
        headers = {
            "Authorization": f"token {settings.github_token}",
            "Accept": "application/vnd.github.v3+json",
        }

        async with httpx.AsyncClient() as client:
            try:
                # 1. Get base branch ref SHA
                ref_url = (
                    f"https://api.github.com/repos/{repository}/" f"git/ref/heads/{base_branch}"
                )
                r_ref = await client.get(ref_url, headers=headers)
                r_ref.raise_for_status()
                base_sha = r_ref.json()["object"]["sha"]

                # 2. Create new branch from base branch
                create_ref_url = f"https://api.github.com/repos/{repository}/git/refs"
                create_ref_payload = {
                    "ref": f"refs/heads/{branch_name}",
                    "sha": base_sha,
                }
                r_branch = await client.post(
                    create_ref_url, headers=headers, json=create_ref_payload
                )
                r_branch.raise_for_status()

                # 3. Get existing file contents to update requirements.txt (if exists)
                content_url = (
                    f"https://api.github.com/repos/{repository}/" f"contents/requirements.txt"
                )
                r_content = await client.get(
                    content_url, headers=headers, params={"ref": base_branch}
                )

                file_sha = None
                current_text = ""
                if r_content.status_code == 200:
                    content_data = r_content.json()
                    file_sha = content_data["sha"]
                    current_text = base64.b64decode(content_data["content"]).decode("utf-8")

                new_text = current_text + f"\n{package_to_add}\n"
                encoded_content = base64.b64encode(new_text.encode("utf-8")).decode("utf-8")

                # 4. Commit updated file to branch
                commit_payload = {
                    "message": "fix: add missing dependency via auto-remediation",
                    "content": encoded_content,
                    "branch": branch_name,
                }
                if file_sha:
                    commit_payload["sha"] = file_sha

                r_commit = await client.put(content_url, headers=headers, json=commit_payload)
                r_commit.raise_for_status()

                # 5. Open Pull Request
                pulls_url = f"https://api.github.com/repos/{repository}/pulls"
                pr_payload = {
                    "title": f"Auto-Remediation: Fix missing dependency in {repository}",
                    "head": branch_name,
                    "base": base_branch,
                    "body": (
                        f"Automated dependency fix for incident {incident.id}.\n"
                        f"Added `{package_to_add}` to `requirements.txt`."
                    ),
                }
                r_pr = await client.post(pulls_url, headers=headers, json=pr_payload)
                r_pr.raise_for_status()
                pr_url = r_pr.json()["html_url"]

                return RemediationResult(
                    success=True,
                    branch_name=branch_name,
                    pr_url=pr_url,
                    patch_content=patch_content,
                    validation=validation,
                )

            except Exception as e:
                logger.error(f"Failed to generate real GitHub PR: {str(e)}")
                return RemediationResult(
                    success=False,
                    branch_name="",
                    pr_url="",
                    patch_content="",
                    validation=validation,
                )
