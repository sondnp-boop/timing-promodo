import { describe, expect, it } from 'vitest';
import { formatDurationHours } from '../../src/shared/formatDuration';

describe('formatDurationHours', () => {
  it.each([
    [0, '0 phút'],
    [-1, '0 phút'],
    [1 / 6, '10 phút'],
    [0.5, '30 phút'],
    [59 / 60, '59 phút'],
    [1, '1 tiếng'],
    [2, '2 tiếng'],
    [2.5, '2.5 tiếng'],
    [2.54, '2.5 tiếng'],
    [1.25, '1.3 tiếng'],
    [0.9999, '1 tiếng'],
    [24, '24 tiếng'],
  ])('%d giờ -> %s', (hours, expected) => {
    expect(formatDurationHours(hours)).toBe(expected);
  });
});
