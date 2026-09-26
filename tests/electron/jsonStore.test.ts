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

  const task = {
    id: 't1',
    name: 'Task A',
    cycleHours: 24,
    offsetsHours: [3, 6, 9],
    cycleStart: 1000,
    pushedOffsetIndexes: [],
    done: false,
    colorIndex: 0,
  };

  it('danh sách task còn nguyên sau khi "tắt app" và mở lại (instance mới)', () => {
    const dir = makeTempDir();
    const first = new JsonStore(dir);
    const data = first.load();
    first.save({ ...data, pushTasks: [task] });

    const reopened = new JsonStore(dir).load();
    expect(reopened.pushTasks).toEqual([task]);
  });

  it('task chỉ mất khi người dùng xóa (save danh sách rỗng)', () => {
    const dir = makeTempDir();
    const store = new JsonStore(dir);
    store.save({ ...createDefaultAppData(), pushTasks: [task] });
    expect(new JsonStore(dir).load().pushTasks).toHaveLength(1);
    store.save({ ...createDefaultAppData(), pushTasks: [] });
    expect(new JsonStore(dir).load().pushTasks).toHaveLength(0);
  });

  it('file chính hỏng thì khôi phục từ bản backup', () => {
    const dir = makeTempDir();
    const store = new JsonStore(dir);
    store.save({ ...createDefaultAppData(), pushTasks: [task] });
    fs.writeFileSync(store.getFilePath(), '{ broken json', 'utf-8');

    expect(new JsonStore(dir).load().pushTasks).toEqual([task]);
  });

  it('cả file chính và backup hỏng: giữ lại file hỏng, trả về dữ liệu mặc định', () => {
    const dir = makeTempDir();
    const store = new JsonStore(dir);
    store.save(createDefaultAppData());
    fs.writeFileSync(store.getFilePath(), 'garbage', 'utf-8');
    fs.writeFileSync(`${store.getFilePath()}.bak`, 'garbage', 'utf-8');

    const data = new JsonStore(dir).load();
    expect(data.pushTasks).toEqual([]);
    expect(fs.readdirSync(dir).some((f) => f.includes('.corrupt-'))).toBe(true);
  });

  it('file cũ thiếu trường thì được bổ sung giá trị mặc định mà không mất task', () => {
    const dir = makeTempDir();
    const store = new JsonStore(dir);
    fs.writeFileSync(
      store.getFilePath(),
      JSON.stringify({ pomodoroSettings: { workMinutes: 50 }, pushTasks: [task] }),
      'utf-8'
    );

    const data = store.load();
    expect(data.pushTasks).toEqual([task]);
    expect(data.pomodoroSettings.workMinutes).toBe(50);
    expect(data.pomodoroSettings.breakMinutes).toBe(5);
    expect(data.playlists.mixset.length).toBeGreaterThan(0);
    expect(data.pushHistory).toEqual([]);
  });

  it('tự tạo thư mục nếu chưa tồn tại', () => {
    const dir = path.join(makeTempDir(), 'nested', 'sub');
    const store = new JsonStore(dir);
    store.save(createDefaultAppData());
    expect(fs.existsSync(store.getFilePath())).toBe(true);
  });
});
