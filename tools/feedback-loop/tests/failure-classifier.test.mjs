import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFailure, shouldRepairWithLlm } from '../src/failure-classifier.mjs';

test('classifies passing execution', () => {
  assert.equal(classifyFailure(0, '1 scenario passed'), 'PASSED');
});

test('classifies undefined Cucumber steps as repairable', () => {
  const category = classifyFailure(1, 'Undefined step: Given something');
  assert.equal(category, 'UNDEFINED_STEP');
  assert.equal(shouldRepairWithLlm(category), true);
});

test('classifies environment conflicts as non-repairable', () => {
  const category = classifyFailure(1, 'Request failed with status: 409 already exists');
  assert.equal(category, 'DIRTY_TEST_ENVIRONMENT');
  assert.equal(shouldRepairWithLlm(category), false);
});
