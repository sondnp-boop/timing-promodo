import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PomodoroClock } from '../../src/features/pomodoro/PomodoroClock';

describe('PomodoroClock', () => {
  it('hiện trạng thái "Chưa chạy" khi state null', () => {
    render(<PomodoroClock state={null} now={0} onStart={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByText('Chưa chạy')).toBeInTheDocument();
  });

  it('gọi onStart("work") khi bấm Bắt đầu làm việc', () => {
    const onStart = vi.fn();
    render(<PomodoroClock state={null} now={0} onStart={onStart} onStop={vi.fn()} />);
    fireEvent.click(screen.getByText('Bắt đầu làm việc'));
    expect(onStart).toHaveBeenCalledWith('work');
  });

  it('hiện đúng pha và thời gian còn lại khi đang chạy', () => {
    const state = { phase: 'work' as const, phaseEndsAt: 90_000, running: true };
    render(<PomodoroClock state={state} now={0} onStart={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByText('Đang làm việc')).toBeInTheDocument();
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('hiện "Đang nghỉ" đúng khi phase = break', () => {
    const state = { phase: 'break' as const, phaseEndsAt: 60_000, running: true };
    render(<PomodoroClock state={state} now={0} onStart={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByText('Đang nghỉ')).toBeInTheDocument();
  });

  it('gọi onStop khi bấm Dừng', () => {
    const onStop = vi.fn();
    const state = { phase: 'work' as const, phaseEndsAt: 90_000, running: true };
    render(<PomodoroClock state={state} now={0} onStart={vi.fn()} onStop={onStop} />);
    fireEvent.click(screen.getByText('Dừng'));
    expect(onStop).toHaveBeenCalled();
  });
});
