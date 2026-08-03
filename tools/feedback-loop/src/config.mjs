import path from 'node:path';
import { ConfigError } from './errors.mjs';
import { readJson, resolveFrom } from './utils.mjs';

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ConfigError(`${field} must be a non-empty string.`);
  }
}

export async function loadConfig(configPathInput) {
  const configPath = path.resolve(configPathInput);
  const baseDir = path.dirname(configPath);
  const raw = await readJson(configPath);

  requireString(raw.caseId, 'caseId');
  requireString(raw.targetRepo, 'targetRepo');
  requireString(raw.prompt?.file, 'prompt.file');
  requireString(raw.provider?.type, 'provider.type');
  requireString(raw.generation?.wrapperTemplate, 'generation.wrapperTemplate');
  requireString(raw.generation?.generatedFile, 'generation.generatedFile');
  requireString(raw.execution?.testCommand, 'execution.testCommand');

  const supportedProviders = new Set(['manual', 'openai', 'command', 'mock']);
  if (!supportedProviders.has(raw.provider.type)) {
    throw new ConfigError(`Unsupported provider.type: ${raw.provider.type}`);
  }

  const maxAttempts = Number(raw.generation.maxAttempts ?? 3);
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
    throw new ConfigError('generation.maxAttempts must be an integer from 1 to 20.');
  }

  const targetRepo = resolveFrom(baseDir, raw.targetRepo);
  const executionCwd = resolveFrom(baseDir, raw.execution.cwd ?? raw.targetRepo);

  return {
    ...raw,
    configPath,
    baseDir,
    targetRepo,
    prompt: {
      ...raw.prompt,
      file: resolveFrom(baseDir, raw.prompt.file),
      buildCwd: resolveFrom(baseDir, raw.prompt.buildCwd ?? '.'),
    },
    provider: {
      ...raw.provider,
      manualDir: resolveFrom(baseDir, raw.provider.manualDir ?? './manual'),
    },
    generation: {
      ...raw.generation,
      maxAttempts,
      wrapperTemplate: resolveFrom(baseDir, raw.generation.wrapperTemplate),
      generatedFile: path.resolve(targetRepo, raw.generation.generatedFile),
    },
    execution: {
      ...raw.execution,
      cwd: executionCwd,
      timeoutSeconds: Number(raw.execution.timeoutSeconds ?? 300),
      server: raw.execution.server ? {
        ...raw.execution.server,
        cwd: resolveFrom(baseDir, raw.execution.server.cwd ?? raw.execution.cwd ?? raw.targetRepo),
        startupTimeoutSeconds: Number(raw.execution.server.startupTimeoutSeconds ?? 30),
      } : null,
    },
    resultsDir: resolveFrom(baseDir, raw.resultsDir ?? './results'),
  };
}
