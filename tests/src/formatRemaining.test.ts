import { describe, expect, it } from 'vitest';
import { formatRemainingLabel } from '../../src/shared/formatRemaining';

const MIN = 60_000;

describe('formatRemainingLabel', () => {
  it.each([
    [0, 'Còn 0 phút'],
    [-5 * MIN, 'Còn 0 phút'],
    [1 * MIN, 'Còn 1 phút'],
    [59 * MIN, 'Còn 59 phút'],
    [60 * MIN, 'Còn 1 tiếng'],
    [119 * MIN, 'Còn 1 tiếng'],
    [180 * MIN, 'Còn 3 tiếng'],
  ])('%i ms -> %s', (ms, expected) => {
    expect(formatRemainingLabel(ms)).toBe(expected);
  });
});
