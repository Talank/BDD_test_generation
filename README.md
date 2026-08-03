# BDD Test Generation

An experiment evaluating LLM-generated BDD end-to-end tests for the [ownCloud `web`](https://github.com/owncloud/web) project (Playwright-based e2e specs).

For a set of test descriptions, an LLM (ChatGPT) was asked to generate the corresponding Playwright/BDD test. Each generated test was assessed for semantic correctness, syntactic correctness, and whether it executed successfully.

## Contents

- **`LLM Test Generation Experiment Matrix ...csv`** — findings for each generated test: target spec file, whether it was semantically/syntactically correct, whether it passed, whether it needed minor fixes, and links to the chat sessions.
- **`diffs/`** — the generated test for each case, as a diff against the original spec.
- **`logs/`** — the Playwright run log for each generated test.

## Cases

| Test | Target spec |
|------|-------------|
| File with same name, different paths | `tests/e2e/specs/shares/share.spec.ts` |
| Receive two shares with same name | `tests/e2e/specs/shares/share.spec.ts` |
| Share with expiration date | `tests/e2e/specs/shares/share.spec.ts` |
| Upload multiple small files | `tests/e2e/specs/smoke/upload.spec.ts` |
| Search using mediaType filter | `tests/e2e/specs/search/search.spec.ts` |

## LLM feedback loop

`tools/feedback-loop/` contains a provider-agnostic workflow for generating missing Cucumber step definitions, executing the selected Cucumber/Playwright scenario, classifying failures, and requesting a corrected generation until the scenario passes or reaches its retry limit.

The default manual provider works with the existing ChatGPT workflow and does not require an API key. OpenAI API and command-line provider adapters are also included for later automation.

```bash
cd tools/feedback-loop
npm test
npm run demo
```

See [`tools/feedback-loop/README.md`](tools/feedback-loop/README.md) for target-repository setup, experiment configuration, manual response handling, result files, and provider options.
