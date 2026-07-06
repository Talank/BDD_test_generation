"""
Minimal .env loader (no external dependency).

Walks up from a starting directory looking for a `.env` file and loads its
KEY=VALUE pairs into os.environ *without* overriding variables that are already
set in the real environment (so `export GITHUB_TOKEN=...` still wins).
"""

import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def load_dotenv(start_dir: Optional[Path] = None, max_up: int = 5) -> Optional[Path]:
    """Find and load the nearest .env. Returns the path loaded, or None."""
    start = Path(start_dir or Path.cwd()).resolve()
    for base in [start, *start.parents][:max_up + 1]:
        env_path = base / '.env'
        if env_path.is_file():
            _apply(env_path)
            return env_path
    return None


def _apply(env_path: Path) -> None:
    try:
        text = env_path.read_text(encoding='utf-8')
    except OSError as e:
        logger.warning("Could not read %s: %s", env_path, e)
        return
    loaded = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        if line.lower().startswith('export '):
            line = line[len('export '):]
        key, _, value = line.partition('=')
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value
            loaded.append(key)
    if loaded:
        logger.info("Loaded %s from %s", ', '.join(loaded), env_path)
