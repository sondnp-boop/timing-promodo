import { describe, expect, it } from 'vitest';
import { FLASH_DURATION_MS, flashPhase } from '../../src/shared/flash';

describe('flashPhase', () => {
  const start = 1_000_000;

  it('không nhấp nháy khi chưa có mốc bắt đầu', () => {
    expect(flashPhase(undefined, start)).toBeNull();
  });

  it('bắt đầu bằng vàng, đổi màu mỗi 1 giây', () => {
    expect(flashPhase(start, start)).toBe('yellow');
    expect(flashPhase(start, start + 999)).toBe('yellow');
    expect(flashPhase(start, start + 1000)).toBe('white');
    expect(flashPhase(start, start + 1999)).toBe('white');
    expect(flashPhase(start, start + 2000)).toBe('yellow');
    expect(flashPhase(start, start + 9000)).toBe('white');
  });

  it('dừng nhấp nháy đúng sau 10 giây', () => {
    expect(FLASH_DURATION_MS).toBe(10_000);
    expect(flashPhase(start, start + 9999)).toBe('white');
    expect(flashPhase(start, start + 10_000)).toBeNull();
    expect(flashPhase(start, start + 60_000)).toBeNull();
  });

  it('thời điểm trước mốc bắt đầu thì không nhấp nháy', () => {
    expect(flashPhase(start, start - 1)).toBeNull();
  });
});
