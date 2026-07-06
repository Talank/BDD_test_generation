"""
Data models (Repository copied from Stage 2 so Stage 3 is self-contained).
The on-disk layout produced by Stage 2's cloner is reused verbatim:
    <repos_dir>/<language>/<normalized_owner>_<normalized_repo>
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List


@dataclass
class Repository:
    """A repository carried over from the Stage 2 selection."""
    name: str          # "owner/repo"
    url: str
    owner: str
    repo_name: str
    language: str
    feature_files: List[str] = field(default_factory=list)
    directories: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any], language: str) -> 'Repository':
        name = data['name']
        owner, repo_name = name.split('/', 1)
        return cls(
            name=name,
            url=data['url'],
            owner=owner,
            repo_name=repo_name,
            language=language,
            feature_files=data.get('feature_files', []) or [],
            directories=data.get('directories', []) or [],
        )

    @staticmethod
    def _normalize_name(name: str) -> str:
        """Normalize a name by replacing special characters (matches Stage 2)."""
        return re.sub(r'[^a-zA-Z0-9_-]', '_', name.lower())

    def get_local_path(self, base_dir: Path) -> Path:
        """Local checkout path, identical to Stage 2's RepositoryCloner layout."""
        return base_dir / self.language / (
            f"{self._normalize_name(self.owner)}_{self._normalize_name(self.repo_name)}"
        )
