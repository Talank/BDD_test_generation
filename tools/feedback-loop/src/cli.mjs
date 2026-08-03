#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from './config.mjs';
import { ManualResponseRequired } from './errors.mjs';
import { runFeedbackLoop, resetRun } from './runner.mjs';
import { pathExists, readJson } from './utils.mjs';

function valueAfter(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

function usage() {
  console.log(`Usage:
  node src/cli.mjs run --config <file>
  node src/cli.mjs status --config <file>
  node src/cli.mjs respond --config <file> --attempt <n> --file <answer-file>
  node src/cli.mjs reset --config <file>
  node src/cli.mjs validate --config <file>`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const configFile = valueAfter(args, '--config');
  if (!command || !configFile) {
    usage();
    process.exitCode = 2;
    return;
  }

  const config = await loadConfig(configFile);

  if (command === 'validate') {
    console.log(`Valid configuration for case: ${config.caseId}`);
    return;
  }

  if (command === 'reset') {
    await resetRun(config);
    console.log(`Reset results for ${config.caseId}`);
    return;
  }

  if (command === 'status') {
    const stateFile = path.join(config.resultsDir, config.caseId, 'state.json');
    if (!(await pathExists(stateFile))) console.log('No run has started.');
    else console.log(JSON.stringify(await readJson(stateFile), null, 2));
    return;
  }

  if (command === 'respond') {
    const attempt = Number(valueAfter(args, '--attempt'));
    const answerFile = valueAfter(args, '--file');
    if (!Number.isInteger(attempt) || attempt < 1 || !answerFile) {
      throw new Error('respond requires --attempt <n> and --file <answer-file>.');
    }
    const destination = path.join(config.provider.manualDir, 'responses', config.caseId, `attempt-${attempt}.txt`);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.resolve(answerFile), destination);
    console.log(`Imported response -> ${destination}`);
    return;
  }

  if (command === 'run') {
    try {
      const summary = await runFeedbackLoop(config);
      console.log(JSON.stringify(summary, null, 2));
      if (summary.status !== 'PASSED') process.exitCode = 1;
    } catch (error) {
      if (error instanceof ManualResponseRequired) {
        console.log('\nManual response needed.');
        console.log(`1. Open: ${error.requestFile}`);
        console.log('2. Paste that prompt into the approved ChatGPT conversation.');
        console.log(`3. Save only the generated bindings to: ${error.responseFile}`);
        console.log('4. Run the same command again.');
        process.exitCode = 3;
        return;
      }
      throw error;
    }
    return;
  }

  usage();
  process.exitCode = 2;
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exit(1);
});
