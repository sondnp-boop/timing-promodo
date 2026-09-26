import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MusicSettingsPanel } from '../../src/features/pomodoro/MusicSettingsPanel';
import { PomodoroSettings } from '../../src/shared/types';

const base: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'pomodoro' };

function setup(settings = base) {
  const props = { onChange: vi.fn(), onPlay: vi.fn(), onEnter: vi.fn() };
  const view = render(<MusicSettingsPanel settings={settings} {...props} />);
  return { ...props, ...view };
}

describe('MusicSettingsPanel', () => {
  it('không còn combobox thể loại; ô URL luôn hiện', () => {
    setup();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Dán link YouTube')).toBeInTheDocument();
  });

  it('ô URL đứng bên trái nút Play trong cùng một dòng', () => {
    const { container } = setup();
    const row = container.querySelector('.music-settings')!;
    const input = screen.getByPlaceholderText('Dán link YouTube');
    const play = screen.getByLabelText('Phát nhạc');
    expect(row).toContainElement(input);
    expect(row).toContainElement(play);
    expect(input.compareDocumentPosition(play) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('bấm Play gọi onPlay', () => {
    const { onPlay } = setup();
    fireEvent.click(screen.getByLabelText('Phát nhạc'));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('Enter trong ô URL gọi onEnter; phím khác thì không', () => {
    const { onEnter } = setup();
    const input = screen.getByPlaceholderText('Dán link YouTube');
    fireEvent.keyDown(input, { key: 'a' });
    expect(onEnter).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('nhập link gọi onChange với customLink', () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByPlaceholderText('Dán link YouTube'), { target: { value: 'https://y.be/x' } });
    expect(onChange).toHaveBeenCalledWith({ ...base, customLink: 'https://y.be/x' });
  });
});
