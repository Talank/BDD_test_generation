import test from 'node:test';
import assert from 'node:assert/strict';
import { injectBindings, normalizeBindings, validateBindings } from '../src/generated-code.mjs';

test('strips code fences and injects bindings', () => {
  const bindings = normalizeBindings("```ts\nThen('x', async function () {})\n```");
  assert.equal(bindings, "Then('x', async function () {})");
  const result = injectBindings('A\n/* GENERATED_BINDINGS_START */\n/* GENERATED_BINDINGS_END */\nB', bindings);
  assert.match(result, /Then\('x'/);
});

test('rejects imports in model output', () => {
  const errors = validateBindings("import x from 'x';\nThen('x', async function () {})");
  assert.ok(errors.some((error) => error.includes('imports')));
});
