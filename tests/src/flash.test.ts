import { describe, expect, it } from 'vitest';
import { WARN_BEFORE_MS, rowAlert } from '../../src/shared/flash';
import { PushTask } from '../../src/shared/types';

const HOUR = 3_600_000;
const start = 1_000_000;

function task(overrides: Partial<PushTask> = {}): PushTask {
  return {
    id: 't',
    name: 'T',
    offsetsHours: [1, 2, 3],
    cycleStart: start,
    pushedOffsetIndexes: [],
    done: false,
    colorIndex: 0,
    ...overrides,
  };
}

describe('rowAlert', () => {
  it('mặc định (xa mọi mốc) không nhấp nháy', () => {
    expect(rowAlert(task(), start)).toBeNull();
    expect(rowAlert(task(), start + 0.5 * HOUR)).toBeNull();
    expect(rowAlert(task(), start + HOUR - WARN_BEFORE_MS - 1)).toBeNull();
  });

  it('15 giây trước mỗi mốc: vàng/trắng đổi mỗi 1 giây', () => {
    expect(WARN_BEFORE_MS).toBe(15_000);
    for (const p of [1, 2]) {
      const w = start + p * HOUR - WARN_BEFORE_MS;
      expect(rowAlert(task(), w)).toBe('yellow');
      expect(rowAlert(task(), w + 999)).toBe('yellow');
      expect(rowAlert(task(), w + 1000)).toBe('white');
      expect(rowAlert(task(), w + 2000)).toBe('yellow');
      expect(rowAlert(task(), w + 13_999)).toBe('white');
      expect(rowAlert(task(), w + 14_999)).toBe('yellow');
    }
  });

  it('nhấp nháy đúng 15 giây rồi về mặc định (mốc không phải mốc cuối)', () => {
    const at = start + HOUR;
    expect(rowAlert(task(), at - 1)).not.toBeNull();
    expect(rowAlert(task(), at)).toBeNull();
    expect(rowAlert(task(), at + 30_000)).toBeNull();
  });

  it('từ mốc cuối cùng: đỏ/xanh liên tục, đổi mỗi 1 giây', () => {
    const end = start + 3 * HOUR;
    expect(rowAlert(task(), end)).toBe('red');
    expect(rowAlert(task(), end + 999)).toBe('red');
    expect(rowAlert(task(), end + 1000)).toBe('green');
    expect(rowAlert(task(), end + 2000)).toBe('red');
    expect(rowAlert(task(), end + 10 * HOUR)).toBe('red');
    expect(rowAlert(task(), end + 10 * HOUR + 1000)).toBe('green');
  });

  it('cửa sổ 15s của mốc cuối là vàng/trắng, ngay sau đó chuyển đỏ/xanh', () => {
    const end = start + 3 * HOUR;
    expect(rowAlert(task(), end - 15_000)).toBe('yellow');
    expect(rowAlert(task(), end - 2_000)).toBe('white');
    expect(rowAlert(task(), end)).toBe('red');
  });

  it('task đã done thì không nhấp nháy', () => {
    const end = start + 3 * HOUR;
    expect(rowAlert(task({ done: true }), end + 5000)).toBeNull();
    expect(rowAlert(task({ done: true }), start + HOUR - 5000)).toBeNull();
  });

  it('không phụ thuộc thứ tự mốc khi khai báo', () => {
    const t = task({ offsetsHours: [3, 1, 2] });
    expect(rowAlert(t, start + 3 * HOUR)).toBe('red');
    expect(rowAlert(t, start + HOUR - 5000)).not.toBeNull();
  });
});
