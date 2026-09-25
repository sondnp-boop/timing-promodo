import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MusicSettingsPanel } from '../../src/features/pomodoro/MusicSettingsPanel';
import { PomodoroSettings } from '../../src/shared/types';

const base: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'pomodoro' };

describe('MusicSettingsPanel', () => {
  it('không có nút Phát nhạc và không có nhãn chữ "Thể loại nhạc"', () => {
    render(<MusicSettingsPanel settings={base} onChange={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Thể loại nhạc')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('pomodoro');
  });

  it('ô link chỉ hiện khi chọn custom và nằm cùng dòng với combobox', () => {
    const { rerender, container } = render(<MusicSettingsPanel settings={base} onChange={vi.fn()} />);
    expect(screen.queryByPlaceholderText('Dán link YouTube')).not.toBeInTheDocument();

    rerender(<MusicSettingsPanel settings={{ ...base, musicGenre: 'custom' }} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Dán link YouTube');
    expect(container.querySelector('.music-settings')).toContainElement(input);
    expect(container.querySelector('.music-settings')).toContainElement(screen.getByRole('combobox'));
  });

  it('đổi thể loại và nhập link gọi onChange', () => {
    const onChange = vi.fn();
    render(<MusicSettingsPanel settings={{ ...base, musicGenre: 'custom' }} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'baroque' } });
    expect(onChange).toHaveBeenCalledWith({ ...base, musicGenre: 'baroque' });
    fireEvent.change(screen.getByPlaceholderText('Dán link YouTube'), { target: { value: 'https://y.be/x' } });
    expect(onChange).toHaveBeenCalledWith({ ...base, musicGenre: 'custom', customLink: 'https://y.be/x' });
  });
});
