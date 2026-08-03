import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, stripCodeFences } from './utils.mjs';

const START = '/* GENERATED_BINDINGS_START */';
const END = '/* GENERATED_BINDINGS_END */';

export function normalizeBindings(raw) {
  return stripCodeFences(raw);
}

export function validateBindings(bindings) {
  const errors = [];
  if (!bindings.trim()) errors.push('The model returned empty output.');
  if (/^\s*import\s/m.test(bindings)) errors.push('Output must not contain imports; imports belong in the wrapper template.');
  if (/^\s*export\s/m.test(bindings)) errors.push('Output must not contain exports.');
  if (bindings.includes('```')) errors.push('Output must not contain Markdown code fences.');
  if (!/\b(?:Given|When|Then)\s*\(|\/\/\s*(?:EXISTS|UNMAPPED)/.test(bindings)) {
    errors.push('Output contains no Given/When/Then binding or EXISTS/UNMAPPED marker.');
  }
  return errors;
}

export function injectBindings(wrapper, bindings) {
  const startIndex = wrapper.indexOf(START);
  const endIndex = wrapper.indexOf(END);
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error(`Wrapper template must contain ${START} and ${END}.`);
  }
  return `${wrapper.slice(0, startIndex + START.length)}\n${bindings.trim()}\n${wrapper.slice(endIndex)}`;
}

export async function writeGeneratedFile({ wrapperFile, generatedFile, bindings }) {
  const wrapper = await fs.readFile(wrapperFile, 'utf8');
  const source = injectBindings(wrapper, bindings);
  await ensureDir(path.dirname(generatedFile));
  await fs.writeFile(generatedFile, source, 'utf8');
  return source;
}
