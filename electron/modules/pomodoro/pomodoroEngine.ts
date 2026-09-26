export type PomodoroPhase = 'work' | 'break';

export interface PomodoroState {
  phase: PomodoroPhase;
  phaseEndsAt: number;
  running: boolean;
}

export interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
}

export function startPhase(phase: PomodoroPhase, config: PomodoroConfig, now: number): PomodoroState {
  const minutes = phase === 'work' ? config.workMinutes : config.breakMinutes;
  return {
    phase,
    phaseEndsAt: now + minutes * 60_000,
    running: true,
  };
}

export const WARNING_SECONDS = [10, 5];

/** Mốc cảnh báo (giây còn lại) nhỏ nhất đã tới mà chưa cảnh báo; null nếu không có. */
export function dueWarning(state: PomodoroState, now: number, warned: ReadonlySet<number>): number | null {
  if (!state.running) {
    return null;
  }
  const remaining = Math.ceil((state.phaseEndsAt - now) / 1000);
  const reached = WARNING_SECONDS.filter((mark) => remaining <= mark && !warned.has(mark));
  return reached.length > 0 ? Math.min(...reached) : null;
}

/**
 * Kiểm tra xem đã tới lúc chuyển pha chưa; nếu có, trả về state của pha kế tiếp
 * (work -> break, break -> work). Nếu chưa tới, trả về null.
 */
export function tick(state: PomodoroState, config: PomodoroConfig, now: number): PomodoroState | null {
  if (!state.running || now < state.phaseEndsAt) {
    return null;
  }
  const nextPhase: PomodoroPhase = state.phase === 'work' ? 'break' : 'work';
  return startPhase(nextPhase, config, now);
}
