# Validation Report

Validated on Node.js 22.16.0 on August 3, 2026.

## Automated test suite

- 6 tests passed.
- Failure classification tested.
- Generated-code normalization and wrapper injection tested.
- End-to-end mock-provider repair loop tested.

## Demo

The included demo intentionally produced an undefined Cucumber step on attempt 1, generated a repair prompt, used a corrected binding on attempt 2, and completed with `status: PASSED`.

## Manual-provider validation

The manual provider was tested through the full pause/resume cycle:

1. Attempt 1 request was written and the CLI exited with the documented manual-response code.
2. A failing response was supplied.
3. Test execution failed with `UNDEFINED_STEP` and an attempt 2 request was written.
4. A corrected response was supplied.
5. Attempt 2 passed and `summary.json` was written.

## Secret scan

The package contains no API keys or credentials. `.env` is ignored and only `.env.example` is included.

## External validation still required

The selected target repository must be cloned at its pinned dataset commit and have its dependencies and browsers installed. The exact ground-truth target bindings must be withheld from the generation prompt and experiment execution copy before evaluating generated replacements.
