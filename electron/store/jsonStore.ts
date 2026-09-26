import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppData, createDefaultAppData } from './schema';

export class JsonStore {
  private readonly filePath: string;
  private readonly backupPath: string;

  constructor(dir: string, fileName = 'app-data.json') {
    this.filePath = path.join(dir, fileName);
    this.backupPath = `${this.filePath}.bak`;
  }

  load(): AppData {
    const main = this.tryRead(this.filePath);
    if (main) {
      return main;
    }
    const backup = this.tryRead(this.backupPath);
    if (backup) {
      return backup;
    }
    if (fs.existsSync(this.filePath)) {
      // Giữ lại file hỏng thay vì ghi đè để không mất dữ liệu cần cứu.
      fs.renameSync(this.filePath, `${this.filePath}.corrupt-${Date.now()}`);
    }
    const initial = createDefaultAppData();
    this.save(initial);
    return initial;
  }

  save(data: AppData): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
    fs.copyFileSync(this.filePath, this.backupPath);
  }

  getFilePath(): string {
    return this.filePath;
  }

  private tryRead(file: string): AppData | null {
    if (!fs.existsSync(file)) {
      return null;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<AppData>;
      const defaults = createDefaultAppData();
      return {
        ...defaults,
        ...parsed,
        pomodoroSettings: { ...defaults.pomodoroSettings, ...parsed.pomodoroSettings },
        playlists: { ...defaults.playlists, ...parsed.playlists },
      };
    } catch {
      return null;
    }
  }
}
