import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PomodoroSettingsPanel, parseWorkBreak } from '../../src/features/pomodoro/PomodoroSettingsPanel';
import { PomodoroSettings } from '../../src/shared/types';

const settings: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'pomodoro' };

describe('parseWorkBreak', () => {
  it('parse x/y hợp lệ', () => {
    expect(parseWorkBreak('30/5')).toEqual({ work: 30, rest: 5 });
    expect(parseWorkBreak(' 45 / 10 ')).toEqual({ work: 45, rest: 10 });
  });

  it.each(['abc', '30', '0/5', '30/0', '30/5/1', '-1/5', '1.5/5', ''])('từ chối "%s"', (text) => {
    expect(parseWorkBreak(text)).toBeNull();
  });
});

describe('PomodoroSettingsPanel', () => {
  it('chỉ có 1 ô, hiển thị giá trị hiện tại dạng x/y', () => {
    render(<PomodoroSettingsPanel settings={settings} onChange={vi.fn()} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByRole('textbox')).toHaveValue('25/5');
  });

  it('gọi onChange với giá trị làm/nghỉ khi nhập 30/5', () => {
    const onChange = vi.fn();
    render(<PomodoroSettingsPanel settings={settings} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '30/5' } });
    expect(onChange).toHaveBeenCalledWith({ ...settings, workMinutes: 30, breakMinutes: 5 });
  });

  it('không gọi onChange khi giá trị không hợp lệ nhưng vẫn giữ text đang gõ', () => {
    const onChange = vi.fn();
    render(<PomodoroSettingsPanel settings={settings} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '30/' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('30/');
  });
});
