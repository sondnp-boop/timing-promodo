import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PomodoroClock } from '../../src/features/pomodoro/PomodoroClock';

describe('PomodoroClock', () => {
  it('hiện trạng thái "Chưa chạy" khi state null và không còn nút bên trong', () => {
    render(<PomodoroClock state={null} now={0} />);
    expect(screen.getByText('Chưa chạy')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hiện đúng pha và thời gian còn lại khi đang chạy', () => {
    const state = { phase: 'work' as const, phaseEndsAt: 90_000, running: true };
    render(<PomodoroClock state={state} now={0} />);
    expect(screen.getByText('Đang làm việc')).toBeInTheDocument();
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('hiện "Đang nghỉ" đúng khi phase = break', () => {
    const state = { phase: 'break' as const, phaseEndsAt: 60_000, running: true };
    render(<PomodoroClock state={state} now={0} />);
    expect(screen.getByText('Đang nghỉ')).toBeInTheDocument();
  });

  it('áp modifier màu theo pha: work / break / chưa chạy', () => {
    const work = { phase: 'work' as const, phaseEndsAt: 90_000, running: true };
    const { container, rerender } = render(<PomodoroClock state={work} now={0} />);
    const display = () => container.querySelector('.pomodoro-clock__display')!;
    expect(display()).toHaveClass('pomodoro-clock__display--work');

    rerender(<PomodoroClock state={{ ...work, phase: 'break' }} now={0} />);
    expect(display()).toHaveClass('pomodoro-clock__display--break');
    expect(display()).not.toHaveClass('pomodoro-clock__display--work');

    rerender(<PomodoroClock state={null} now={0} />);
    expect(display().className).not.toMatch(/--(work|break)/);
  });
});
