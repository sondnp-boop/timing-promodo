import { describe, expect, it, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { JsonStore } from '../../electron/store/jsonStore';
import { createDefaultAppData } from '../../electron/store/schema';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'timing-promodo-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('JsonStore', () => {
  it('tạo file dữ liệu mặc định nếu chưa tồn tại', () => {
    const dir = makeTempDir();
    const store = new JsonStore(dir);
    const data = store.load();
    expect(data).toEqual(createDefaultAppData());
    expect(fs.existsSync(store.getFilePath())).toBe(true);
  });

  it('ghi rồi đọc lại đúng dữ liệu', () => {
    const dir = makeTempDir();
    const store = new JsonStore(dir);
    const data = createDefaultAppData();
    data.pomodoroSettings.workMinutes = 50;
    store.save(data);

    const reloaded = new JsonStore(dir).load();
    expect(reloaded.pomodoroSettings.workMinutes).toBe(50);
  });

  it('ghi atomic: không để lại file .tmp sau khi save', () => {
    const dir = makeTempDir();
    const store = new JsonStore(dir);
    store.save(createDefaultAppData());
    expect(fs.existsSync(`${store.getFilePath()}.tmp`)).toBe(false);
  });

  it('tự tạo thư mục nếu chưa tồn tại', () => {
    const dir = path.join(makeTempDir(), 'nested', 'sub');
    const store = new JsonStore(dir);
    store.save(createDefaultAppData());
    expect(fs.existsSync(store.getFilePath())).toBe(true);
  });
});
