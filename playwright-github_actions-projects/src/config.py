"""
Stage 3 configuration.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Set


@dataclass
class Config:
    """Main configuration for the Playwright + CI filter."""
    input_file: str
    output_dir: Path
    repos_dir: Path
    languages: Set[str] = field(default_factory=lambda: {'nodejs', 'java'})
    max_repos: Optional[int] = None
    skip_clone: bool = False
    workers: int = 4

    # Analysis knobs
    clone_timeout: int = 1800          # 30 minutes, matches Stage 2
    max_file_size: int = 1024 * 1024   # 1 MB cap when reading manifests/configs
    max_scan_depth: int = 4            # how deep to recurse for manifests

    # GitHub API
    github_token_env: str = 'GITHUB_TOKEN'
    api_base: str = 'https://api.github.com'
