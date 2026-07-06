"""
Static detection of GitHub Actions configuration on a cloned repository.

Emits which workflow files exist under .github/workflows and whether any of them
appears to run tests / Playwright. The definitive "runs & passes" check is done
separately via the Actions API (actions_api.py); this only gates which repos are
worth an API call.
"""

import logging
import re
from pathlib import Path
from typing import Dict, List

from .config import Config
from .models import Repository

# Command markers that indicate a workflow actually exercises tests / Playwright.
_TEST_MARKERS = [
    re.compile(r'playwright\s+install', re.I),
    re.compile(r'npx\s+playwright', re.I),
    re.compile(r'playwright\s+test', re.I),
    re.compile(r'bddgen', re.I),                 # playwright-bdd codegen
    re.compile(r'npm\s+(run\s+)?test', re.I),
    re.compile(r'yarn\s+test', re.I),
    re.compile(r'pnpm\s+(run\s+)?test', re.I),
    re.compile(r'\bcucumber\b', re.I),
    re.compile(r'mvn\b.*\btest', re.I),
    re.compile(r'gradle\b.*\btest', re.I),
    re.compile(r'\./gradlew\b.*test', re.I),
]


class CIDetector:
    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)

    def detect(self, repo: Repository, repo_path: Path) -> Dict:
        wf_dir = repo_path / '.github' / 'workflows'
        if not wf_dir.is_dir():
            return {'has_workflows': False, 'workflow_files': [], 'mentions_test': False}

        workflow_files: List[str] = []
        mentions_test = False
        matched_markers: List[str] = []

        for p in sorted(wf_dir.iterdir()):
            if p.suffix.lower() not in ('.yml', '.yaml') or not p.is_file():
                continue
            workflow_files.append(p.name)
            try:
                if p.stat().st_size > self.config.max_file_size:
                    continue
                text = p.read_text(encoding='utf-8', errors='ignore')
            except OSError:
                continue
            for marker in _TEST_MARKERS:
                if marker.search(text):
                    mentions_test = True
                    matched_markers.append(marker.pattern)

        return {
            'has_workflows': bool(workflow_files),
            'workflow_files': workflow_files,
            'mentions_test': mentions_test,
            'test_markers': sorted(set(matched_markers)),
        }
