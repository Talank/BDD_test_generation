# BDD LLM Feedback Loop

A provider-agnostic runner for the assigned task: generate Cucumber step definitions, execute the target Cucumber/Playwright scenario, feed repairable failures back to an LLM, and repeat until the generated steps execute successfully or the retry limit is reached.

## What is already implemented

- Runs the existing `prompt_builder.js` automatically when configured.
- Supports **manual ChatGPT mode with no API key**.
- Supports an OpenAI API adapter for later use.
- Supports a generic command-line model adapter.
- Inserts generated bindings into a target repo using a safe wrapper template.
- Validates model output before execution.
- Starts and stops a target application server when needed.
- Executes one scenario or feature using a configurable command.
- Classifies syntax, import, type, undefined-step, duplicate-step, assertion, timeout, fixture, dirty-environment, and application failures.
- Sends only repairable failures back to the model.
- Saves every prompt, generated binding, log, attempt record, final result, state file, and experiment CSV.
- Resumes manual runs without losing the prior attempt.
- Includes automated unit and integration tests plus a two-attempt demo.

## Requirements

- Node.js 20 or newer.
- A local clone of `Talank/BDD_test_generation`.
- A local clone of the selected target repository at its pinned dataset commit.
- The target repository's dependencies and Playwright browsers installed.

No npm dependencies are required for this runner itself.

The repository workflow `.github/workflows/feedback-loop.yml` runs the test suite and demo whenever this tool changes.

## Install into the shared repository

Place this folder at:

```text
BDD_test_generation/tools/feedback-loop/
```

Then:

```bash
cd tools/feedback-loop
npm test
npm run demo
```

## Manual ChatGPT mode, no API key

Copy and edit a config:

```bash
cp examples/manual.config.json config.json
```

Validate it:

```bash
node src/cli.mjs validate --config config.json
```

Start the loop:

```bash
node src/cli.mjs run --config config.json
```

The first run pauses and prints two paths:

```text
manual/requests/<case-id>/attempt-1.md
manual/responses/<case-id>/attempt-1.txt
```

Open the request, paste it into the team's approved ChatGPT conversation, and save only ChatGPT's generated bindings into the response file. Then run the same command again. If the test fails with a repairable problem, the runner creates `attempt-2.md` containing the original prompt, prior generated code, failure category, and execution log. Repeat until it passes or reaches the attempt limit.

An answer can also be imported with:

```bash
node src/cli.mjs respond \
  --config config.json \
  --attempt 1 \
  --file ~/Downloads/chatgpt-answer.txt
```

## Later: OpenAI API mode

Change the provider in `config.json`:

```json
{
  "provider": {
    "type": "openai",
    "model": "PROJECT_APPROVED_MODEL"
  }
}
```

Set the credential locally:

```bash
export OPENAI_API_KEY="..."
```

No other runner code changes are needed.

## Generic command provider

The command provider sends the prompt through stdin and reads the model response from stdout:

```json
{
  "provider": {
    "type": "command",
    "command": "your-model-cli --plain",
    "cwd": ".",
    "timeoutSeconds": 300
  }
}
```

This can support a future agentic tool, local model, or approved institutional CLI.

## Espresso Addict example

The included example uses:

- Repository: `YevShch/Espresso-Addict-Playwright-Cucumber`
- Commit: `24c3160bd0719a66feadf4138d8a6e83caed974e`
- Scenario: `Verify help button displays game information`
- Server command: `node index.js`
- Health URL: `http://localhost:3000`
- Test command: one named Cucumber scenario from `help_function.feature`

Set up the target:

```bash
./scripts/setup-espresso-addict.sh ~/Desktop/BDD-Work
```

Copy these two files into your working feedback-loop directory:

```text
examples/espresso-addict.config.json -> config.json
examples/espresso-addict.generated-steps.template.js -> espresso-addict.generated-steps.template.js
```

The paths assume this layout:

```text
BDD-Work/
├── BDD_test_generation/
│   ├── prompt_builder.js
│   ├── generated-prompts/
│   └── tools/feedback-loop/
└── target-repo/
```

### Important experimental preparation

The target repository already contains its ground-truth step definitions. For a legitimate generation experiment, the exact target bindings must be withheld from the prompt and execution copy before generating replacements. Otherwise the prompt may reveal the answer or Cucumber may report duplicate definitions. Use the team's prepared holdout copy or remove only the selected ground-truth bindings on an experiment branch while keeping a backup for comparison. This runner deliberately does not mutate ground-truth files automatically.

## Result layout

```text
results/
├── experiment-results.csv
└── <case-id>/
    ├── state.json
    ├── attempt-1-prompt.md
    ├── attempt-1-bindings.js
    ├── attempt-1.log
    ├── attempt-1.json
    ├── attempt-2-...
    ├── final-bindings.js
    └── summary.json
```

## Failure policy

Sent back to the LLM:

- Syntax errors
- Missing imports or unknown symbols
- Type errors
- Duplicate or ambiguous Cucumber bindings
- Undefined steps
- Assertion or behavior mismatches
- Invalid model output
- Unknown code failures

Stopped for human/environment repair:

- Server or application failure
- Missing fixture files
- Dirty state or HTTP 409 conflicts
- Timeouts and likely flakes

This avoids asking the LLM to "fix" a dead server, missing browser, or duplicate database record, a ritual that produces code but not progress.

## Commands

```bash
node src/cli.mjs run --config config.json
node src/cli.mjs status --config config.json
node src/cli.mjs reset --config config.json
node src/cli.mjs validate --config config.json
node src/cli.mjs respond --config config.json --attempt 1 --file answer.txt
```
