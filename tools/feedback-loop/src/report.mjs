import fs from 'node:fs/promises';
import path from 'node:path';
import { csvEscape, ensureDir, pathExists, writeJson } from './utils.mjs';

const headers = [
  'case_id',
  'repository',
  'commit_sha',
  'scenario',
  'status',
  'attempts',
  'last_failure_category',
  'generated_step_file',
  'completed_at',
];

export async function saveAttempt(resultsCaseDir, attempt, data) {
  await ensureDir(resultsCaseDir);
  await fs.writeFile(path.join(resultsCaseDir, `attempt-${attempt}.log`), data.output ?? '', 'utf8');
  await fs.writeFile(path.join(resultsCaseDir, `attempt-${attempt}-bindings.js`), data.bindings ?? '', 'utf8');
  await fs.writeFile(path.join(resultsCaseDir, `attempt-${attempt}-prompt.md`), data.prompt ?? '', 'utf8');
  await writeJson(path.join(resultsCaseDir, `attempt-${attempt}.json`), data.metadata);
}

export async function saveSummary(config, summary) {
  const resultsCaseDir = path.join(config.resultsDir, config.caseId);
  await ensureDir(resultsCaseDir);
  await writeJson(path.join(resultsCaseDir, 'summary.json'), summary);
  if (summary.finalBindings) {
    await fs.writeFile(path.join(resultsCaseDir, 'final-bindings.js'), summary.finalBindings, 'utf8');
  }

  const csvPath = path.join(config.resultsDir, 'experiment-results.csv');
  const row = {
    case_id: config.caseId,
    repository: config.metadata?.repository ?? '',
    commit_sha: config.metadata?.commitSha ?? '',
    scenario: config.metadata?.scenario ?? '',
    status: summary.status,
    attempts: summary.attempts,
    last_failure_category: summary.lastFailureCategory ?? '',
    generated_step_file: config.generation.generatedFile,
    completed_at: summary.completedAt,
  };

  let rows = [];
  if (await pathExists(csvPath)) {
    const existing = await fs.readFile(csvPath, 'utf8');
    rows = existing.trim().split(/\r?\n/).slice(1).filter(Boolean);
  }
  rows = rows.filter((line) => csvEscape(config.caseId) !== line.split(',')[0]);
  rows.push(headers.map((header) => csvEscape(row[header])).join(','));
  await fs.writeFile(csvPath, `${headers.join(',')}\n${rows.join('\n')}\n`, 'utf8');
}
