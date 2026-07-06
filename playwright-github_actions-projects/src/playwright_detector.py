"""
Static detection of "Playwright drives the BDD" on a cloned repository.

Every repo in the input already uses Cucumber (Stage 2 guarantee), so the job here
is to confirm Playwright is present AND wired into the Cucumber/step layer.

Confidence levels:
  STRONG  - unambiguous Playwright+Cucumber integration
  MEDIUM  - both present but no wiring found (or a bare playwright.config)
  (none)  - not detected
"""

import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional

from .config import Config
from .models import Repository

# Directories we never descend into.
_IGNORE_DIRS = {
    '.git', 'node_modules', 'vendor', 'dist', 'build', 'target', 'out',
    'coverage', '.venv', 'venv', '__pycache__', '.gradle', '.idea', 'bin',
}

# Node manifest / config markers.
_PW_TEST_PKGS = ('@playwright/test', 'playwright', 'playwright-core')
_PW_BDD_PKGS = ('playwright-bdd',)
_CUCUMBER_PKGS = ('@cucumber/cucumber', 'cucumber')

# Regexes for import wiring.
_JS_PW_IMPORT = re.compile(r"""(from\s+|require\(\s*)['"](@playwright/test|playwright(-core)?)['"]""")
_JS_CUC_IMPORT = re.compile(r"""(from\s+|require\(\s*)['"](@cucumber/cucumber|cucumber)['"]""")
_JAVA_PW_IMPORT = re.compile(r"import\s+com\.microsoft\.playwright")
_JAVA_CUC_IMPORT = re.compile(r"import\s+io\.cucumber")

# File hints that mark a likely step/glue/support file.
_GLUE_HINTS = ('step', 'support', 'glue', 'hooks', 'world', 'fixture')

_JS_EXTS = ('.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx')


class PlaywrightDetector:
    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)

    def detect(self, repo: Repository, repo_path: Path) -> Dict:
        """Return a detection dict: {detected, confidence, evidence:[...]}"""
        if not repo_path.exists():
            return {'detected': False, 'confidence': None, 'evidence': [],
                    'note': 'checkout missing'}
        if repo.language == 'nodejs':
            return self._detect_node(repo, repo_path)
        if repo.language == 'java':
            return self._detect_java(repo, repo_path)
        return {'detected': False, 'confidence': None, 'evidence': [],
                'note': f'unsupported language {repo.language}'}

    # ------------------------------------------------------------------ helpers

    def _read(self, path: Path) -> Optional[str]:
        try:
            if path.stat().st_size > self.config.max_file_size:
                return None
            return path.read_text(encoding='utf-8', errors='ignore')
        except OSError:
            return None

    def _walk_files(self, root: Path, exts, want_hint: bool):
        """Yield files with the given extensions, skipping heavy dirs.

        If want_hint, only yield files whose path suggests a step/glue/support role.
        Bounded to avoid pathological repos.
        """
        count = 0
        limit = 4000
        for p in root.rglob('*'):
            if count >= limit:
                return
            parts = set(part.lower() for part in p.parts)
            if parts & _IGNORE_DIRS:
                continue
            if p.is_dir() or p.suffix.lower() not in exts:
                continue
            count += 1
            if want_hint:
                low = str(p).lower()
                if not any(h in low for h in _GLUE_HINTS):
                    continue
            yield p

    def _rel(self, repo_path: Path, p: Path) -> str:
        try:
            return str(p.relative_to(repo_path))
        except ValueError:
            return str(p)

    # ------------------------------------------------------------------ node

    def _collect_node_deps(self, root: Path):
        """Union of dep names across all package.json files, plus files scanned."""
        deps = set()
        pkg_files = []
        for p in root.rglob('package.json'):
            if set(part.lower() for part in p.parts) & _IGNORE_DIRS:
                continue
            text = self._read(p)
            if not text:
                continue
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue
            pkg_files.append(p)
            for section in ('dependencies', 'devDependencies', 'peerDependencies',
                            'optionalDependencies'):
                sec = data.get(section)
                if isinstance(sec, dict):
                    deps.update(sec.keys())
        return deps, pkg_files

    def _detect_node(self, repo: Repository, repo_path: Path) -> Dict:
        evidence: List[str] = []
        deps, pkg_files = self._collect_node_deps(repo_path)

        has_pw_bdd = any(p in deps for p in _PW_BDD_PKGS)
        has_pw = any(p in deps for p in _PW_TEST_PKGS)
        has_cuc = any(p in deps for p in _CUCUMBER_PKGS)

        if has_pw_bdd:
            evidence.append('package.json declares "playwright-bdd"')
        if has_pw and not has_pw_bdd:
            evidence.append('package.json declares a Playwright package')
        if has_cuc:
            evidence.append('package.json declares a Cucumber package')

        # playwright.config.*
        pw_config = None
        for name in ('playwright.config.ts', 'playwright.config.js',
                     'playwright.config.mjs', 'playwright.config.cjs'):
            hits = [c for c in root_glob(repo_path, name)]
            if hits:
                pw_config = self._rel(repo_path, hits[0])
                break
        if pw_config:
            evidence.append(f'{pw_config} present')

        # Import wiring in step/support/glue files.
        wiring_file = None
        for f in self._walk_files(repo_path, _JS_EXTS, want_hint=True):
            text = self._read(f)
            if not text:
                continue
            if _JS_PW_IMPORT.search(text):
                wiring_file = self._rel(repo_path, f)
                break
        if wiring_file:
            evidence.append(f'{wiring_file} imports Playwright in a step/support file')

        # Classify.
        if has_pw_bdd:
            confidence = 'STRONG'
        elif wiring_file and has_cuc:
            confidence = 'STRONG'
        elif (has_pw and has_cuc) or pw_config or wiring_file:
            confidence = 'MEDIUM'
        else:
            confidence = None

        return {
            'detected': confidence is not None,
            'confidence': confidence,
            'evidence': evidence,
            'package_json_count': len(pkg_files),
        }

    # ------------------------------------------------------------------ java

    def _detect_java(self, repo: Repository, repo_path: Path) -> Dict:
        evidence: List[str] = []

        build_text = []
        build_files = []
        for pattern in ('pom.xml', 'build.gradle', 'build.gradle.kts'):
            for p in root_glob_recursive(repo_path, pattern):
                if set(part.lower() for part in p.parts) & _IGNORE_DIRS:
                    continue
                t = self._read(p)
                if t:
                    build_text.append(t)
                    build_files.append(p)
        joined = '\n'.join(build_text)
        build_has_pw = 'com.microsoft.playwright' in joined
        build_has_cuc = 'io.cucumber' in joined
        if build_has_pw:
            evidence.append('build file declares com.microsoft.playwright')
        if build_has_cuc:
            evidence.append('build file declares io.cucumber')

        # Glue file importing both.
        wiring_file = None
        for f in self._walk_files(repo_path, ('.java',), want_hint=True):
            text = self._read(f)
            if not text:
                continue
            if _JAVA_PW_IMPORT.search(text) and _JAVA_CUC_IMPORT.search(text):
                wiring_file = self._rel(repo_path, f)
                break
        # Fallback: any .java importing playwright (broader) if hinted scan found nothing.
        if not wiring_file:
            for f in self._walk_files(repo_path, ('.java',), want_hint=False):
                text = self._read(f)
                if not text:
                    continue
                if _JAVA_PW_IMPORT.search(text) and _JAVA_CUC_IMPORT.search(text):
                    wiring_file = self._rel(repo_path, f)
                    break
        if wiring_file:
            evidence.append(f'{wiring_file} imports both Playwright and Cucumber')

        if wiring_file:
            confidence = 'STRONG'
        elif build_has_pw and build_has_cuc:
            confidence = 'MEDIUM'
        else:
            confidence = None

        return {
            'detected': confidence is not None,
            'confidence': confidence,
            'evidence': evidence,
            'build_files': [self._rel(repo_path, b) for b in build_files],
        }


def root_glob(root: Path, name: str):
    """Top-level-first glob: root file then shallow matches (skipping heavy dirs)."""
    top = root / name
    if top.exists():
        return [top]
    results = []
    for p in root.rglob(name):
        if set(part.lower() for part in p.parts) & _IGNORE_DIRS:
            continue
        results.append(p)
    return results


def root_glob_recursive(root: Path, name: str):
    for p in root.rglob(name):
        yield p
