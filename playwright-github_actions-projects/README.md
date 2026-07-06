# Playwright + CI Filter


1. **Use Playwright to drive their Cucumber/BDD scenarios** — Playwright must be wired
   into the step/glue layer (not merely present as a dependency), and
2. **Have GitHub Actions configured *and passing*** — at least one workflow under
   `.github/workflows`, with the latest **completed** run on the default branch
   concluding `success` (checked via the GitHub Actions API).

## How it works (hybrid)

Static detection runs offline on shallow clones (cheap, thorough); the GitHub Actions
API is called **only** for the small set of repos that survive static filtering, so API
usage stays far under rate limits.

```
load nodejs+java  ->  shallow clone  ->  static scan (Playwright + workflows)
   ->  survivors (Playwright + workflows)  ->  Actions API run-status  ->  included
```

## Install

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

## Usage

The Actions verification needs a GitHub Personal Access Token. Put it in a `.env`
file at the project root (auto-loaded, searched upward from the run directory) or
export it — a real environment variable takes precedence over `.env`:

```bash
# .env at Subset root:  GITHUB_TOKEN=ghp_xxx   (public_repo / repo:read scope)
# ...or export it explicitly:
export GITHUB_TOKEN=ghp_xxx
python3 -B main.py \
  --input ../projects_selection.json \
  --repos-dir ../repositories \
  --output-dir ./output \
  --languages nodejs java \
  --workers 4
# or: make run
```

| Flag | Meaning |
| ---- | ------- |
| `--input` | Stage 2 `projects_selection.json` |
| `--repos-dir` | Where repos are cloned / already stored |
| `--output-dir` | Where results are written |
| `--languages` | Languages to scan (default `nodejs java`) |
| `--workers` | Clone parallelism (default 4) |
| `--skip-clone` | Reuse existing checkouts, don't clone |
| `--no-api` | Skip Actions API; treat "workflow mentions a test/playwright command" as the CI signal |
| `--max-repos N` | Process only the first N repos (sanity runs) |

`make sample` runs the first 20 repos with static detection only — a quick way to eyeball
the Playwright classifications before a full run.

## Output (`./output/`)

- `playwright_ci_scan.json` — every scanned repo with full Playwright + CI + API evidence (audit trail).
- `playwright_ci_projects.json` — the final filtered dataset, grouped by language.
- `playwright_ci_projects.csv` — quick-scan table.
- `summary.log` — funnel counts and the repos dropped at each step, with reasons.
- `cache/` — raw GitHub API responses (for reproducible re-runs).

## Playwright confidence levels

- **STRONG** — `playwright-bdd` dependency (JS), or a step/support file importing both
  Playwright and Cucumber (JS/Java).
- **MEDIUM** — Playwright + Cucumber both declared, or a bare `playwright.config.*`, but
  no import wiring found. Included if CI passes; review these manually if precision matters.
