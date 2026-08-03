import fs from 'node:fs/promises';
import { pathExists } from './utils.mjs';
import { runCommand } from './process-runner.mjs';

export async function ensurePrompt(config) {
  const shouldBuild = Boolean(config.prompt.buildCommand) && (
    config.prompt.rebuild === true || !(await pathExists(config.prompt.file))
  );

  if (shouldBuild) {
    const result = await runCommand(config.prompt.buildCommand, {
      cwd: config.prompt.buildCwd,
      timeoutSeconds: config.prompt.buildTimeoutSeconds ?? 120,
    });
    if (result.exitCode !== 0) {
      throw new Error(`Prompt builder failed.\n${result.stdout}\n${result.stderr}`);
    }
  }

  if (!(await pathExists(config.prompt.file))) {
    throw new Error(`Prompt file does not exist: ${config.prompt.file}`);
  }

  return fs.readFile(config.prompt.file, 'utf8');
}

export function buildRepairPrompt({ originalPrompt, previousBindings, category, output }) {
  return `
The generated cucumber-js step definitions failed and must be repaired.

# ORIGINAL GENERATION PROMPT
${originalPrompt}

# PREVIOUS GENERATED BINDINGS
\`\`\`ts
${previousBindings}
\`\`\`

# FAILURE CATEGORY
${category}

# COMPILER OR EXECUTION OUTPUT
\`\`\`text
${String(output).slice(-16000)}
\`\`\`

# REPAIR RULES
1. Preserve the exact Gherkin intent from the original prompt.
2. Return only the complete replacement Given/When/Then bindings.
3. Do not return imports, exports, a World class, Markdown fences, or prose.
4. Use only DSL functions, constants, and World members present in the original prompt.
5. Do not duplicate a binding listed under EXISTING STEP DEFINITIONS.
6. Use async function (...) rather than an arrow function when the World is accessed through this.
7. Make the smallest correction required by the failure.
8. Do not change the feature file, test data, application, or environment to hide a failure.
`.trim();
}
