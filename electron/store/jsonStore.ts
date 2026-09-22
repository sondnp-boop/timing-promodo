import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppData, createDefaultAppData } from './schema';

export class JsonStore {
  private readonly filePath: string;

  constructor(dir: string, fileName = 'app-data.json') {
    this.filePath = path.join(dir, fileName);
  }

  load(): AppData {
    if (!fs.existsSync(this.filePath)) {
      const initial = createDefaultAppData();
      this.save(initial);
      return initial;
    }
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(raw) as AppData;
  }

  save(data: AppData): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }

  getFilePath(): string {
    return this.filePath;
  }
}
