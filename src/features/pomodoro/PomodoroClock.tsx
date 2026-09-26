import { PomodoroState } from '../../shared/types';

interface PomodoroClockProps {
  state: PomodoroState | null;
  now: number;
  onStart: (phase: 'work' | 'break') => void;
  onStop: () => void;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function PomodoroClock({ state, now, onStart, onStop }: PomodoroClockProps) {
  return (
    <div className="pomodoro-clock" data-testid="pomodoro-clock">
      {state ? (
        <>
          <div className={`pomodoro-clock__display pomodoro-clock__display--${state.phase}`}>
            <div className="pomodoro-clock__phase">{state.phase === 'work' ? 'Đang làm việc' : 'Đang nghỉ'}</div>
            <div className="pomodoro-clock__time">{formatRemaining(state.phaseEndsAt - now)}</div>
          </div>
          <button type="button" className="pomodoro-clock__btn" onClick={onStop}>
            Dừng
          </button>
        </>
      ) : (
        <>
          <div className="pomodoro-clock__display">
            <div className="pomodoro-clock__idle">Chưa chạy</div>
          </div>
          <button type="button" className="pomodoro-clock__btn" onClick={() => onStart('work')}>
            Bắt đầu làm việc
          </button>
        </>
      )}
    </div>
  );
}
