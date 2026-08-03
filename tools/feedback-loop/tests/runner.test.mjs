import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.mjs';
import { runFeedbackLoop } from '../src/runner.mjs';

test('feedback loop repairs a failing generated binding', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'bdd-loop-test-'));
  const target = path.join(temp, 'target');
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(temp, 'prompt.md'), 'Generate a Then binding.');
  await fs.writeFile(path.join(temp, 'wrapper.js'), '/* GENERATED_BINDINGS_START */\n/* GENERATED_BINDINGS_END */\n');
  await fs.writeFile(path.join(target, 'check.mjs'), `
import fs from 'node:fs';
const source = fs.readFileSync(new URL('./generated.js', import.meta.url), 'utf8');
if (source.includes('FIXED')) process.exit(0);
console.error('Undefined step: Then fixed');
process.exit(1);
`);
  const configPath = path.join(temp, 'config.json');
  await fs.writeFile(configPath, JSON.stringify({
    caseId: 'test-case',
    targetRepo: target,
    prompt: { file: './prompt.md' },
    provider: {
      type: 'mock',
      responses: [
        "Then('fixed', async function () { /* BROKEN */ });",
        "Then('fixed', async function () { /* FIXED */ });"
      ]
    },
    generation: {
      wrapperTemplate: './wrapper.js',
      generatedFile: 'generated.js',
      maxAttempts: 3
    },
    execution: {
      cwd: target,
      testCommand: 'node check.mjs',
      timeoutSeconds: 10
    },
    resultsDir: './results'
  }, null, 2));

  const config = await loadConfig(configPath);
  const summary = await runFeedbackLoop(config);
  assert.equal(summary.status, 'PASSED');
  assert.equal(summary.attempts, 2);
});
