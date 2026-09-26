import { describe, expect, it } from 'vitest';
import { buildExportLines, buildExportText } from '../../src/shared/exportTasks';
import { PushTask } from '../../src/shared/types';

const HOUR = 3_600_000;

function task(id: string, overrides: Partial<PushTask> = {}): PushTask {
  return {
    id,
    name: `Công việc ${id}`,
    offsetsHours: [1, 2, 3],
    cycleStart: 0,
    pushedOffsetIndexes: [],
    done: false,
    colorIndex: 0,
    ...overrides,
  };
}

describe('buildExportLines', () => {
  it('done trước, progress sau; đánh số liên tục; progress có thời gian trôi qua / chu kỳ', () => {
    const tasks = [
      task('B', { offsetsHours: [1, 2, 3] }),
      task('C', { offsetsHours: [3, 4, 5], cycleStart: -0.5 * HOUR }),
      task('A', { done: true }),
    ];
    expect(buildExportLines(tasks, 0.5 * HOUR)).toEqual([
      '1. Công việc A. Done',
      '2. Công việc B. Progress. 30 phút / 1,2,3',
      '3. Công việc C. Progress. 1 tiếng / 3,4,5',
    ]);
  });

  it('giữ thứ tự ban đầu trong mỗi nhóm', () => {
    const lines = buildExportLines(
      [task('1'), task('2', { done: true }), task('3'), task('4', { done: true })],
      0
    );
    expect(lines.map((l) => l.split('. ')[1])).toEqual(['Công việc 2', 'Công việc 4', 'Công việc 1', 'Công việc 3']);
  });

  it('tên nhiều dòng được gộp thành một dòng', () => {
    expect(buildExportLines([task('X', { name: 'Dòng 1\n  Dòng 2', done: true })], 0)).toEqual([
      '1. Dòng 1 Dòng 2. Done',
    ]);
  });

  it('danh sách rỗng cho văn bản rỗng', () => {
    expect(buildExportLines([], 0)).toEqual([]);
    expect(buildExportText([], 0)).toBe('');
  });

  it('buildExportText nối các dòng bằng xuống dòng', () => {
    expect(buildExportText([task('A', { done: true }), task('B', { done: true })], 0)).toBe(
      '1. Công việc A. Done\n2. Công việc B. Done'
    );
  });
});
