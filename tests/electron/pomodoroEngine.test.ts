import { describe, expect, it } from 'vitest';
import { dueWarning, startPhase, tick, PomodoroConfig } from '../../electron/modules/pomodoro/pomodoroEngine';

const config: PomodoroConfig = { workMinutes: 25, breakMinutes: 5 };

describe('pomodoroEngine', () => {
  it('startPhase tính đúng thời điểm kết thúc pha work', () => {
    const now = 1_000_000;
    const state = startPhase('work', config, now);
    expect(state.phase).toBe('work');
    expect(state.running).toBe(true);
    expect(state.phaseEndsAt).toBe(now + 25 * 60_000);
  });

  it('tick trả về null khi chưa hết thời gian pha hiện tại', () => {
    const now = 1_000_000;
    const state = startPhase('work', config, now);
    const result = tick(state, config, now + 1000);
    expect(result).toBeNull();
  });

  it('tick chuyển từ work sang break đúng lúc hết giờ', () => {
    const now = 1_000_000;
    const state = startPhase('work', config, now);
    const endOfWork = state.phaseEndsAt;
    const result = tick(state, config, endOfWork);
    expect(result).not.toBeNull();
    expect(result!.phase).toBe('break');
    expect(result!.phaseEndsAt).toBe(endOfWork + 5 * 60_000);
  });

  it('tick chuyển từ break về work', () => {
    const now = 1_000_000;
    const breakState = startPhase('break', config, now);
    const result = tick(breakState, config, breakState.phaseEndsAt);
    expect(result!.phase).toBe('work');
  });

  it('tick trả về null khi state không running', () => {
    const state = { phase: 'work' as const, phaseEndsAt: 0, running: false };
    expect(tick(state, config, 999999)).toBeNull();
  });
});

describe('dueWarning', () => {
  const now = 1_000_000;
  const state = { phase: 'break' as const, phaseEndsAt: now + 60_000, running: true };
  const none = new Set<number>();

  it('null khi còn nhiều hơn 10 giây', () => {
    expect(dueWarning(state, now, none)).toBeNull();
  });

  it('trả 10 khi còn đúng 10 giây', () => {
    expect(dueWarning(state, state.phaseEndsAt - 10_000, none)).toBe(10);
  });

  it('trả 5 khi còn đúng 5 giây và 10 đã cảnh báo', () => {
    expect(dueWarning(state, state.phaseEndsAt - 5_000, new Set([10]))).toBe(5);
  });

  it('null khi mốc đã được cảnh báo', () => {
    expect(dueWarning(state, state.phaseEndsAt - 9_500, new Set([10]))).toBeNull();
    expect(dueWarning(state, state.phaseEndsAt - 4_000, new Set([10, 5]))).toBeNull();
  });

  it('trễ tick vẫn trả mốc nhỏ nhất đã tới', () => {
    expect(dueWarning(state, state.phaseEndsAt - 4_000, none)).toBe(5);
  });

  it('áp dụng cho cả pha làm việc; null khi không chạy', () => {
    const work = { ...state, phase: 'work' as const };
    expect(dueWarning(work, work.phaseEndsAt - 10_000, none)).toBe(10);
    expect(dueWarning({ ...work, running: false }, work.phaseEndsAt - 10_000, none)).toBeNull();
  });
});
