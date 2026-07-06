"""
Output assembly: full audit scan, filtered dataset, CSV, and a funnel summary.
"""

import csv
import json
import logging
from pathlib import Path
from typing import Dict, List


class Report:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.logger = logging.getLogger(__name__)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def write(self, records: List[Dict], funnel: Dict) -> None:
        """records: one dict per scanned repo (see main.py for shape)."""
        self._write_scan(records)
        self._write_filtered(records)
        self._write_csv(records)
        self._write_summary(records, funnel)

    def _write_scan(self, records: List[Dict]) -> None:
        path = self.output_dir / 'playwright_ci_scan.json'
        path.write_text(json.dumps(records, indent=2), encoding='utf-8')
        self.logger.info("Wrote audit scan: %s (%d repos)", path, len(records))

    @staticmethod
    def _entry(r: Dict) -> Dict:
        return {
            'name': r['name'],
            'url': r['url'],
            'feature_files': r.get('feature_files', []),
            'directories': r.get('directories', []),
            'playwright': r['playwright'],
            'github_actions': r['github_actions'],
            'ci_status': r['ci_status'],
            'included': r.get('included', False),
        }

    def write_stage(self, records: List[Dict], predicate, filename: str,
                    label: str) -> int:
        """Write a grouped-by-language subset of records matching predicate.

        Returns the count written. Used for intermediate checkpoints so partial
        progress survives even if a later stage is interrupted.
        """
        grouped: Dict[str, List[Dict]] = {}
        for r in records:
            if predicate(r):
                grouped.setdefault(r['language'], []).append(self._entry(r))
        for lang in grouped:
            grouped[lang].sort(key=lambda e: e['name'])
        path = self.output_dir / filename
        path.write_text(json.dumps(grouped, indent=2), encoding='utf-8')
        total = sum(len(v) for v in grouped.values())
        self.logger.info("Wrote %s: %s (%d repos)", label, path, total)
        return total

    def _write_filtered(self, records: List[Dict]) -> None:
        self.write_stage(records, lambda r: r.get('included'),
                         'playwright_ci_projects.json', 'filtered dataset')

    def _write_csv(self, records: List[Dict]) -> None:
        path = self.output_dir / 'playwright_ci_projects.csv'
        with path.open('w', newline='', encoding='utf-8') as f:
            w = csv.writer(f)
            w.writerow(['name', 'url', 'language', 'included',
                        'pw_detected', 'pw_confidence',
                        'has_workflows', 'workflow_files', 'mentions_test',
                        'default_branch', 'latest_run_conclusion', 'verified_passing'])
            for r in records:
                pw = r['playwright']
                ga = r['github_actions']
                ci = r['ci_status'] or {}
                w.writerow([
                    r['name'], r['url'], r['language'], r.get('included', False),
                    pw.get('detected'), pw.get('confidence'),
                    ga.get('has_workflows'), ';'.join(ga.get('workflow_files', [])),
                    ga.get('mentions_test'),
                    ci.get('default_branch'), ci.get('latest_run_conclusion'),
                    ci.get('verified_passing'),
                ])
        self.logger.info("Wrote CSV: %s", path)

    def _write_summary(self, records: List[Dict], funnel: Dict) -> None:
        path = self.output_dir / 'summary.log'
        lines = []
        lines.append('=' * 70)
        lines.append('PLAYWRIGHT + CI FILTER — FUNNEL SUMMARY')
        lines.append('=' * 70)
        for label, count in funnel.items():
            lines.append(f'{label:<45} {count:>6}')
        lines.append('=' * 70)

        def dropped(reason_key, predicate):
            names = [r['name'] for r in records if predicate(r)]
            lines.append(f'\n{reason_key} ({len(names)}):')
            lines.extend(f'  - {n}' for n in sorted(names))

        dropped('DROPPED: Playwright not detected',
                lambda r: not r['playwright'].get('detected'))
        dropped('DROPPED: no GitHub Actions workflows',
                lambda r: r['playwright'].get('detected')
                and not r['github_actions'].get('has_workflows'))
        dropped('DROPPED: CI not verified passing',
                lambda r: r['playwright'].get('detected')
                and r['github_actions'].get('has_workflows')
                and not (r['ci_status'] or {}).get('verified_passing'))
        lines.append('\nINCLUDED (' + str(sum(1 for r in records if r.get('included'))) + '):')
        lines.extend(f'  - {r["name"]}' for r in sorted(
            (r for r in records if r.get('included')), key=lambda r: r['name']))

        path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
        self.logger.info("Wrote summary: %s", path)
