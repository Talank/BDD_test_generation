"""
GitHub Actions API client.

For a survivor repo (Playwright-detected AND has workflow files), confirm CI is
"properly set up" == the latest *completed* workflow run on the default branch
concluded with success.

Token is read from the env var named by Config.github_token_env (default GITHUB_TOKEN).
Raw JSON responses are cached under <output_dir>/cache/ for reproducibility.
Rate limiting (HTTP 403 with X-RateLimit-Remaining: 0) is honored via X-RateLimit-Reset.
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Dict, Optional

import requests

from .config import Config
from .models import Repository


class ActionsAPI:
    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.session = requests.Session()

        token = os.environ.get(config.github_token_env, '').strip()
        self.authenticated = bool(token)
        headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'bdd-playwright-ci-filter',
        }
        if token:
            headers['Authorization'] = f'Bearer {token}'
        else:
            self.logger.warning(
                "No %s set - running unauthenticated (60 req/hr). "
                "Provide a token for reliable Actions verification.",
                config.github_token_env,
            )
        self.session.headers.update(headers)

        self.cache_dir = config.output_dir / 'cache'
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------ HTTP

    def _get(self, url: str, params: Optional[Dict] = None,
             cache_key: Optional[str] = None) -> Optional[Dict]:
        cache_file = self.cache_dir / f'{cache_key}.json' if cache_key else None
        if cache_file and cache_file.exists():
            try:
                return json.loads(cache_file.read_text(encoding='utf-8'))
            except (OSError, json.JSONDecodeError):
                pass

        for attempt in range(6):
            try:
                resp = self.session.get(url, params=params, timeout=30)
            except requests.RequestException as e:
                self.logger.warning("Request error %s: %s", url, e)
                time.sleep(2 ** attempt)
                continue

            remaining = resp.headers.get('X-RateLimit-Remaining')
            if resp.status_code == 403 and remaining == '0':
                reset = int(resp.headers.get('X-RateLimit-Reset', '0'))
                wait = max(reset - int(time.time()), 1) + 1
                self.logger.warning("Rate limited; sleeping %ss until reset.", wait)
                time.sleep(min(wait, 3600))
                continue
            if resp.status_code == 404:
                return {'__status__': 404}
            if resp.status_code in (500, 502, 503):
                time.sleep(2 ** attempt)
                continue
            if resp.status_code != 200:
                self.logger.warning("HTTP %s for %s", resp.status_code, url)
                return {'__status__': resp.status_code}

            data = resp.json()
            if cache_file:
                try:
                    cache_file.write_text(json.dumps(data), encoding='utf-8')
                except OSError:
                    pass
            if remaining is not None and remaining.isdigit() and int(remaining) < 50:
                self.logger.info("GitHub API budget low: %s remaining", remaining)
            return data

        self.logger.warning("Giving up after retries: %s", url)
        return None

    # ------------------------------------------------------------------ public

    def verify(self, repo: Repository) -> Dict:
        """Return {available, default_branch, latest_run_conclusion, verified_passing}."""
        owner, name = repo.owner, repo.repo_name
        slug = repo.name.replace('/', '__')

        meta = self._get(f'{self.config.api_base}/repos/{owner}/{name}',
                         cache_key=f'{slug}__repo')
        if not meta or meta.get('__status__') == 404:
            return {'available': False, 'reason': 'repo not found / private',
                    'default_branch': None, 'latest_run_conclusion': None,
                    'verified_passing': False}
        if '__status__' in meta:
            return {'available': False, 'reason': f"http {meta['__status__']}",
                    'default_branch': None, 'latest_run_conclusion': None,
                    'verified_passing': False}

        default_branch = meta.get('default_branch')
        # Latest completed run on ANY branch (not restricted to the default branch),
        # so repos that only run CI on PR/feature branches still count.
        runs = self._get(
            f'{self.config.api_base}/repos/{owner}/{name}/actions/runs',
            params={'status': 'completed', 'per_page': 10},
            cache_key=f'{slug}__runs',
        )
        if not runs or '__status__' in runs:
            return {'available': True, 'reason': 'no runs accessible',
                    'default_branch': default_branch,
                    'latest_run_conclusion': None, 'verified_passing': False}

        workflow_runs = runs.get('workflow_runs', []) or []
        if not workflow_runs:
            return {'available': True, 'reason': 'no completed runs on any branch',
                    'default_branch': default_branch,
                    'latest_run_conclusion': None, 'verified_passing': False}

        latest = workflow_runs[0]  # API returns newest-first across all branches
        conclusion = latest.get('conclusion')
        return {
            'available': True,
            'default_branch': default_branch,
            'latest_run_conclusion': conclusion,
            'latest_run_branch': latest.get('head_branch'),
            'latest_run_workflow': latest.get('name'),
            'latest_run_url': latest.get('html_url'),
            'verified_passing': conclusion == 'success',
        }
