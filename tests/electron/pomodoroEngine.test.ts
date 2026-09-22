import { describe, expect, it } from 'vitest';
import { startPhase, tick, PomodoroConfig } from '../../electron/modules/pomodoro/pomodoroEngine';

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
