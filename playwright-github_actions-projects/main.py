#!/usr/bin/env python3
"""
Stage 3 — Playwright + CI filter.

Reads the Stage 2 selection (projects_selection.json), and keeps only repositories
that (a) use Playwright to drive their Cucumber/BDD scenarios and (b) have GitHub
Actions configured and with the latest default-branch run passing.

Pipeline:
  1. Load nodejs/java repos from the input JSON.
  2. Shallow-clone them (reuse Stage 2 clone approach) unless --skip-clone.
  3. Static scan: Playwright-drives-BDD detection + workflow-file detection.
  4. Filter survivors = Playwright detected AND has workflow files.
  5. Actions API: verify latest default-branch run == success (needs GITHUB_TOKEN).
  6. Write audit scan, filtered dataset, CSV, and funnel summary.
"""

import argparse
import json
import logging
import sys
from pathlib import Path

from src.actions_api import ActionsAPI
from src.ci_detector import CIDetector
from src.config import Config
from src.models import Repository
from src.playwright_detector import PlaywrightDetector
from src.report import Report
from src.repository_cloner import RepositoryCloner
from src.utils.dotenv import load_dotenv
from src.utils.logger import setup_logger


def load_repositories(config: Config, logger) -> list:
    with open(config.input_file, encoding='utf-8') as f:
        data = json.load(f)

    repos = []
    for language in sorted(config.languages):
        for entry in data.get(language, []):
            try:
                repos.append(Repository.from_dict(entry, language))
            except (KeyError, ValueError) as e:
                logger.warning("Skipping malformed entry in %s: %s", language, e)
    repos.sort(key=lambda r: r.name)
    if config.max_repos:
        repos = repos[:config.max_repos]
    return repos


def main() -> int:
    parser = argparse.ArgumentParser(description='Playwright + CI filter (Stage 3)')
    parser.add_argument('--input', '-i', default='../projects_selection.json',
                        help='Stage 2 selection JSON')
    parser.add_argument('--output-dir', '-o', default='./output')
    parser.add_argument('--repos-dir', '-r', default='../repositories')
    parser.add_argument('--languages', '-l', nargs='+', default=['nodejs', 'java'])
    parser.add_argument('--workers', '-w', type=int, default=4)
    parser.add_argument('--max-repos', '-m', type=int, default=None)
    parser.add_argument('--skip-clone', action='store_true',
                        help='Use already-cloned repos on disk')
    parser.add_argument('--no-api', action='store_true',
                        help='Skip the Actions API verification (static only)')
    parser.add_argument('--verbose', '-v', action='store_true')
    args = parser.parse_args()

    setup_logger(logging.DEBUG if args.verbose else logging.INFO)
    logger = logging.getLogger(__name__)

    # Load .env (searches up from cwd, then from the input file's location) so that
    # GITHUB_TOKEN placed in a project .env is picked up. Real env vars still win.
    if not load_dotenv():
        load_dotenv(Path(args.input).resolve().parent)

    config = Config(
        input_file=args.input,
        output_dir=Path(args.output_dir),
        repos_dir=Path(args.repos_dir),
        languages=set(args.languages),
        max_repos=args.max_repos,
        skip_clone=args.skip_clone,
        workers=args.workers,
    )
    config.output_dir.mkdir(parents=True, exist_ok=True)
    config.repos_dir.mkdir(parents=True, exist_ok=True)

    logger.info('=' * 70)
    logger.info('STAGE 3 — PLAYWRIGHT + CI FILTER')
    logger.info('Input=%s  Repos=%s  Output=%s  Languages=%s',
                config.input_file, config.repos_dir, config.output_dir,
                sorted(config.languages))
    logger.info('=' * 70)

    repos = load_repositories(config, logger)
    logger.info('Loaded %d repositories (%s)', len(repos), sorted(config.languages))
    if not repos:
        logger.error('No repositories to process.')
        return 1

    # Clone.
    if not config.skip_clone:
        RepositoryCloner(config).clone_repositories(repos)
    else:
        logger.info('Skipping clone (using existing checkouts).')

    pw_detector = PlaywrightDetector(config)
    ci_detector = CIDetector(config)

    records = []
    cloned = pw_detected = has_wf = 0
    for i, repo in enumerate(repos, 1):
        repo_path = repo.get_local_path(config.repos_dir)
        present = repo_path.exists()
        if present:
            cloned += 1

        pw = pw_detector.detect(repo, repo_path)
        ga = ci_detector.detect(repo, repo_path)
        if pw.get('detected'):
            pw_detected += 1
        if pw.get('detected') and ga.get('has_workflows'):
            has_wf += 1

        records.append({
            'name': repo.name, 'url': repo.url, 'language': repo.language,
            'feature_files': repo.feature_files, 'directories': repo.directories,
            'checkout_present': present,
            'playwright': pw, 'github_actions': ga,
            'ci_status': None, 'included': False,
        })
        if i % 50 == 0:
            logger.info('Static scan %d/%d', i, len(repos))

    logger.info('Static scan done. Playwright-detected=%d, with-workflows=%d',
                pw_detected, has_wf)

    # Intermediate checkpoints (persist static results before the API stage).
    report = Report(config.output_dir)
    report.write_stage(records, lambda r: r['playwright'].get('detected'),
                       'stage1_playwright.json', 'stage 1 (Playwright detected)')
    report.write_stage(
        records,
        lambda r: r['playwright'].get('detected') and r['github_actions'].get('has_workflows'),
        'stage2_with_workflows.json', 'stage 2 (Playwright + workflows)')

    # Survivors -> Actions API verification.
    survivors = [r for r in records
                 if r['playwright'].get('detected')
                 and r['github_actions'].get('has_workflows')]

    verified = 0
    if survivors and not args.no_api:
        api = ActionsAPI(config)
        logger.info('Verifying CI run status for %d survivors via Actions API...',
                    len(survivors))
        for j, r in enumerate(survivors, 1):
            repo = next(x for x in repos if x.name == r['name'])
            ci = api.verify(repo)
            r['ci_status'] = ci
            r['included'] = bool(ci.get('verified_passing'))
            if r['included']:
                verified += 1
            if j % 20 == 0:
                logger.info('API verify %d/%d', j, len(survivors))
    elif args.no_api:
        logger.info('--no-api set: including survivors whose workflow mentions tests.')
        for r in survivors:
            r['included'] = bool(r['github_actions'].get('mentions_test'))
            r['ci_status'] = {'note': 'api skipped; static mentions_test used',
                              'verified_passing': r['included']}
            verified += int(r['included'])

    funnel = {
        'Loaded repositories': len(repos),
        'Cloned / present on disk': cloned,
        'Playwright detected': pw_detected,
        'Playwright + has workflows': has_wf,
        'Included (CI verified passing)': verified,
    }

    report.write_stage(records, lambda r: r.get('included'),
                       'stage3_ci_passing.json', 'stage 3 (CI verified passing)')
    report.write(records, funnel)

    logger.info('=' * 70)
    for label, count in funnel.items():
        logger.info('%-45s %6d', label, count)
    logger.info('=' * 70)
    logger.info('Done. Results in %s', config.output_dir)
    return 0


if __name__ == '__main__':
    sys.exit(main())
