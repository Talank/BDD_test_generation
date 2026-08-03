const rules = [
  ['SYNTAX_ERROR', [
    /syntaxerror/i,
    /unexpected token/i,
    /parsing error/i,
    /unterminated/i,
  ]],
  ['UNKNOWN_SYMBOL_OR_IMPORT', [
    /cannot find name/i,
    /cannot find module/i,
    /is not defined/i,
    /is not a function/i,
    /module not found/i,
  ]],
  ['TYPE_ERROR', [
    /typeerror/i,
    /error ts\d+/i,
    /type .* is not assignable/i,
  ]],
  ['DUPLICATE_OR_AMBIGUOUS_STEP', [
    /duplicate step definition/i,
    /ambiguous match/i,
    /multiple step definitions/i,
    /matches more than one step definition/i,
  ]],
  ['UNDEFINED_STEP', [
    /undefined step/i,
    /undefined steps/i,
    /implement with the following snippet/i,
  ]],
  ['TIMEOUT_OR_FLAKE', [
    /timed out/i,
    /timeout/i,
    /target page, context or browser has been closed/i,
  ]],
  ['DIRTY_TEST_ENVIRONMENT', [
    /status\s*:?\s*409/i,
    /already exists/i,
    /duplicate key/i,
    /conflict/i,
  ]],
  ['MISSING_FIXTURE', [
    /enoent/i,
    /no such file or directory/i,
    /fixture .* not found/i,
  ]],
  ['APPLICATION_OR_ENVIRONMENT_FAILURE', [
    /econnrefused/i,
    /connection refused/i,
    /500 internal server error/i,
    /502 bad gateway/i,
    /503 service unavailable/i,
    /browser executable .* doesn't exist/i,
  ]],
  ['ASSERTION_OR_BEHAVIOR_FAILURE', [
    /assertionerror/i,
    /expected .* but got/i,
    /expected:/i,
    /received:/i,
    /to equal/i,
    /to contain/i,
  ]],
];

export function classifyFailure(exitCode, output) {
  if (exitCode === 0) return 'PASSED';
  const text = String(output ?? '');
  for (const [category, patterns] of rules) {
    if (patterns.some((pattern) => pattern.test(text))) return category;
  }
  return 'UNKNOWN_FAILURE';
}

const repairable = new Set([
  'SYNTAX_ERROR',
  'UNKNOWN_SYMBOL_OR_IMPORT',
  'TYPE_ERROR',
  'DUPLICATE_OR_AMBIGUOUS_STEP',
  'UNDEFINED_STEP',
  'ASSERTION_OR_BEHAVIOR_FAILURE',
  'UNKNOWN_FAILURE',
]);

export function shouldRepairWithLlm(category) {
  return repairable.has(category);
}
