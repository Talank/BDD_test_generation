import { spawn } from 'node:child_process';

export class CommandProvider {
  constructor(options = {}) {
    if (!options.command) throw new Error('provider.command is required for the command provider.');
    this.command = options.command;
    this.cwd = options.cwd;
    this.timeoutSeconds = Number(options.timeoutSeconds ?? 300);
  }

  async generate({ prompt }) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, {
        cwd: this.cwd,
        shell: true,
        env: process.env,
      });
      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Provider command timed out after ${this.timeoutSeconds}s.`));
      }, this.timeoutSeconds * 1000);

      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      child.on('error', reject);
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) reject(new Error(`Provider command failed (${code}): ${stderr}`));
        else resolve(stdout);
      });
      child.stdin.end(prompt);
    });
  }
}
