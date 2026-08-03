import fs from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function resolveFrom(baseDir, value) {
  if (!value) return null;
  return path.isAbsolute(value) ? value : path.resolve(baseDir, value);
}

export function stripCodeFences(value) {
  const text = String(value ?? '').trim();
  const fenced = text.match(/^```(?:typescript|ts|javascript|js)?\s*\n?([\s\S]*?)\n?```$/i);
  return (fenced ? fenced[1] : text).trim();
}

export function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function timestamp() {
  return new Date().toISOString();
}
