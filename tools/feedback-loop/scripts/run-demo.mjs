import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.mjs';
import { runFeedbackLoop } from '../src/runner.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'bdd-loop-demo-'));
const target = path.join(temp, 'target');
await fs.mkdir(target, { recursive: true });

await fs.writeFile(path.join(target, 'run-test.mjs'), `
import fs from 'node:fs';
const source = fs.readFileSync(new URL('./generated.steps.js', import.meta.url), 'utf8');
if (source.includes('FIXED_BINDING')) {
  console.log('1 scenario (1 passed)');
  process.exit(0);
}
console.error('Undefined step: Then the result should be correct');
process.exit(1);
`, 'utf8');

const promptFile = path.join(temp, 'prompt.md');
const wrapperFile = path.join(temp, 'wrapper.js');
const configFile = path.join(temp, 'config.json');
await fs.writeFile(promptFile, '# Demo prompt\nGenerate a missing Then binding.\n');
await fs.writeFile(wrapperFile, `import { Then } from '@cucumber/cucumber';\n/* GENERATED_BINDINGS_START */\n/* GENERATED_BINDINGS_END */\n`);
await fs.writeFile(configFile, JSON.stringify({
  caseId: 'demo',
  targetRepo: target,
  prompt: { file: promptFile },
  provider: {
    type: 'mock',
    responses: [
      "Then('the result should be correct', async function () { /* BROKEN_BINDING */ });",
      "Then('the result should be correct', async function () { /* FIXED_BINDING */ });"
    ]
  },
  generation: {
    wrapperTemplate: wrapperFile,
    generatedFile: 'generated.steps.js',
    maxAttempts: 3
  },
  execution: {
    cwd: target,
    testCommand: 'node run-test.mjs',
    timeoutSeconds: 10
  },
  resultsDir: path.join(temp, 'results')
}, null, 2));

const config = await loadConfig(configFile);
const summary = await runFeedbackLoop(config);
console.log('\nDemo summary:');
console.log(JSON.stringify(summary, null, 2));
console.log(`\nDemo files: ${temp}`);
