import fs from 'node:fs/promises';
import path from 'node:path';
import { classifyFailure, shouldRepairWithLlm } from './failure-classifier.mjs';
import { normalizeBindings, validateBindings, writeGeneratedFile } from './generated-code.mjs';
import { ensurePrompt, buildRepairPrompt } from './prompt.mjs';
import { runCommand, startServer, stopServer } from './process-runner.mjs';
import { createProvider } from './providers/index.mjs';
import { saveAttempt, saveSummary } from './report.mjs';
import { ensureDir, pathExists, readJson, timestamp, writeJson } from './utils.mjs';

function statePath(config) {
  return path.join(config.resultsDir, config.caseId, 'state.json');
}

async function loadState(config) {
  const file = statePath(config);
  if (await pathExists(file)) return readJson(file);
  return {
    caseId: config.caseId,
    nextAttempt: 1,
    status: 'READY',
    previousBindings: null,
    previousCategory: null,
    previousOutput: null,
    createdAt: timestamp(),
  };
}

async function saveState(config, state) {
  await writeJson(statePath(config), state);
}

async function executeTest(config) {
  let server = null;
  try {
    server = await startServer(config.execution.server);
    return await runCommand(config.execution.testCommand, {
      cwd: config.execution.cwd,
      timeoutSeconds: config.execution.timeoutSeconds,
      env: config.execution.env ?? {},
    });
  } finally {
    stopServer(server);
  }
}

export async function runFeedbackLoop(config) {
  await ensureDir(path.join(config.resultsDir, config.caseId));
  const originalPrompt = await ensurePrompt(config);
  const provider = createProvider(config);
  const state = await loadState(config);

  if (state.status === 'PASSED') return state;

  for (let attempt = state.nextAttempt; attempt <= config.generation.maxAttempts; attempt += 1) {
    const prompt = attempt === 1
      ? originalPrompt
      : buildRepairPrompt({
          originalPrompt,
          previousBindings: state.previousBindings,
          category: state.previousCategory,
          output: state.previousOutput,
        });

    state.status = 'GENERATING';
    state.nextAttempt = attempt;
    await saveState(config, state);

    const raw = await provider.generate({ prompt, attempt, state });
    const bindings = normalizeBindings(raw);
    const validationErrors = validateBindings(bindings);

    let execution;
    let output;
    let category;

    if (validationErrors.length) {
      execution = { exitCode: 2, timedOut: false, stdout: '', stderr: validationErrors.join('\n') };
      output = validationErrors.join('\n');
      category = 'INVALID_MODEL_OUTPUT';
    } else {
      await writeGeneratedFile({
        wrapperFile: config.generation.wrapperTemplate,
        generatedFile: config.generation.generatedFile,
        bindings,
      });

      try {
        execution = await executeTest(config);
        output = `${execution.stdout}\n${execution.stderr}`.trim();
        category = classifyFailure(execution.exitCode, output);
      } catch (error) {
        output = `${error.message}\n${error.serverOutput ?? ''}`.trim();
        execution = { exitCode: 1, timedOut: false, stdout: '', stderr: output };
        category = 'APPLICATION_OR_ENVIRONMENT_FAILURE';
      }
    }

    await saveAttempt(path.join(config.resultsDir, config.caseId), attempt, {
      prompt,
      bindings,
      output,
      metadata: {
        attempt,
        exitCode: execution.exitCode,
        timedOut: execution.timedOut,
        category,
        generatedFile: config.generation.generatedFile,
        recordedAt: timestamp(),
      },
    });

    if (category === 'PASSED') {
      const summary = {
        caseId: config.caseId,
        status: 'PASSED',
        attempts: attempt,
        lastFailureCategory: state.previousCategory,
        generatedFile: config.generation.generatedFile,
        finalBindings: bindings,
        completedAt: timestamp(),
      };
      state.status = 'PASSED';
      state.nextAttempt = attempt;
      state.completedAt = summary.completedAt;
      await saveState(config, state);
      await saveSummary(config, summary);
      return summary;
    }

    const repairable = category === 'INVALID_MODEL_OUTPUT' || shouldRepairWithLlm(category);
    state.previousBindings = bindings;
    state.previousCategory = category;
    state.previousOutput = output;
    state.nextAttempt = attempt + 1;

    if (!repairable) {
      const summary = {
        caseId: config.caseId,
        status: 'BLOCKED_BY_ENVIRONMENT',
        attempts: attempt,
        lastFailureCategory: category,
        generatedFile: config.generation.generatedFile,
        completedAt: timestamp(),
      };
      state.status = summary.status;
      await saveState(config, state);
      await saveSummary(config, summary);
      return summary;
    }

    await saveState(config, state);
  }

  const summary = {
    caseId: config.caseId,
    status: 'FAILED_AFTER_MAX_ATTEMPTS',
    attempts: config.generation.maxAttempts,
    lastFailureCategory: state.previousCategory,
    generatedFile: config.generation.generatedFile,
    completedAt: timestamp(),
  };
  state.status = summary.status;
  await saveState(config, state);
  await saveSummary(config, summary);
  return summary;
}

export async function resetRun(config) {
  await fs.rm(path.join(config.resultsDir, config.caseId), { recursive: true, force: true });
}
