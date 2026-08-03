import { spawn } from 'node:child_process';

export function runCommand(command, { cwd, timeoutSeconds = 300, env = {} } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
    }, timeoutSeconds * 1_000);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        exitCode: timedOut ? 124 : (code ?? 1),
        stdout,
        stderr,
        timedOut,
        signal,
      });
    });
  });
}

async function waitForHealth(url, timeoutSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1_000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok || response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Server health check failed for ${url}: ${lastError?.message ?? 'timeout'}`);
}

export async function startServer(server) {
  if (!server) return null;

  const child = spawn(server.command, {
    cwd: server.cwd,
    shell: true,
    detached: process.platform !== 'win32',
    env: { ...process.env, ...(server.env ?? {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });

  try {
    if (server.healthUrl) {
      await waitForHealth(server.healthUrl, server.startupTimeoutSeconds ?? 30);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  } catch (error) {
    stopServer(child);
    error.serverOutput = output;
    throw error;
  }

  return child;
}

export function stopServer(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform !== 'win32' && child.pid) {
      process.kill(-child.pid, 'SIGTERM');
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    child.kill('SIGTERM');
  }
}
