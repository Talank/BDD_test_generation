import fs from 'node:fs/promises';
import path from 'node:path';
import { ManualResponseRequired } from '../errors.mjs';
import { ensureDir, pathExists } from '../utils.mjs';

export class ManualProvider {
  constructor({ manualDir, caseId }) {
    this.manualDir = manualDir;
    this.caseId = caseId;
  }

  async generate({ prompt, attempt }) {
    const requestDir = path.join(this.manualDir, 'requests', this.caseId);
    const responseDir = path.join(this.manualDir, 'responses', this.caseId);
    const requestFile = path.join(requestDir, `attempt-${attempt}.md`);
    const responseFile = path.join(responseDir, `attempt-${attempt}.txt`);

    await ensureDir(requestDir);
    await ensureDir(responseDir);
    await fs.writeFile(requestFile, `${prompt.trim()}\n`, 'utf8');

    if (!(await pathExists(responseFile))) {
      throw new ManualResponseRequired({ requestFile, responseFile, attempt });
    }

    const response = await fs.readFile(responseFile, 'utf8');
    if (!response.trim()) {
      throw new ManualResponseRequired({ requestFile, responseFile, attempt });
    }
    return response;
  }
}
