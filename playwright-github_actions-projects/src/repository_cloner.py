"""
Repository cloning (adapted from Stage 2 with configurable worker count).
Shallow, single-branch clones. Repos already on disk are left untouched.
"""

import logging
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List

from .config import Config
from .models import Repository


class RepositoryCloner:
    """Manages shallow cloning of repositories."""

    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)

    def clone_repositories(self, repositories: List[Repository]) -> None:
        self.logger.info(f"Cloning {len(repositories)} repositories...")

        for language in self.config.languages:
            (self.config.repos_dir / language).mkdir(parents=True, exist_ok=True)

        max_workers = min(self.config.workers, len(repositories)) or 1

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_repo = {
                executor.submit(self._clone_repository, repo): repo
                for repo in repositories
            }
            completed = 0
            for future in as_completed(future_to_repo):
                repo = future_to_repo[future]
                try:
                    if future.result():
                        self.logger.debug(f"✓ Cloned: {repo.name}")
                    else:
                        self.logger.warning(f"✗ Failed: {repo.name}")
                except Exception as e:
                    self.logger.error(f"✗ Error cloning {repo.name}: {e}")

                completed += 1
                if completed % 25 == 0:
                    self.logger.info(f"Progress: {completed}/{len(repositories)} processed")

        self.logger.info("Cloning finished.")

    def _clone_repository(self, repo: Repository) -> bool:
        local_path = repo.get_local_path(self.config.repos_dir)

        if local_path.exists():
            self.logger.debug(f"Already present: {local_path}")
            return True

        try:
            local_path.parent.mkdir(parents=True, exist_ok=True)
            cmd = [
                'git', 'clone',
                '--depth', '1',
                '--single-branch',
                repo.url,
                str(local_path),
            ]
            result = subprocess.run(
                cmd, capture_output=True, text=True,
                timeout=self.config.clone_timeout
            )
            if result.returncode == 0:
                return True
            self.logger.warning(f"git clone error {repo.name}: {result.stderr.strip()[:200]}")
            if local_path.exists():
                shutil.rmtree(local_path, ignore_errors=True)
            return False
        except subprocess.TimeoutExpired:
            self.logger.warning(f"Timeout cloning {repo.name}")
            if local_path.exists():
                shutil.rmtree(local_path, ignore_errors=True)
            return False
        except Exception as e:
            self.logger.warning(f"Error cloning {repo.name}: {e}")
            if local_path.exists():
                shutil.rmtree(local_path, ignore_errors=True)
            return False
