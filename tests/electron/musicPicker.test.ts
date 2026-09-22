import { describe, expect, it } from 'vitest';
import { pickMusicLink } from '../../electron/modules/pomodoro/musicPicker';
import { Playlists, PomodoroSettings } from '../../electron/store/schema';

const playlists: Playlists = {
  mixset: ['mix1', 'mix2'],
  pomodoro: ['pomo1', 'pomo2', 'pomo3'],
  baroque: ['baroque1'],
};

describe('musicPicker', () => {
  it('chọn link nằm trong playlist đúng thể loại', () => {
    const settings: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'pomodoro' };
    const link = pickMusicLink(settings, playlists, () => 0.5);
    expect(playlists.pomodoro).toContain(link);
  });

  it('random = 0 chọn phần tử đầu tiên', () => {
    const settings: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'mixset' };
    expect(pickMusicLink(settings, playlists, () => 0)).toBe('mix1');
  });

  it('random gần 1 chọn phần tử cuối cùng', () => {
    const settings: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'mixset' };
    expect(pickMusicLink(settings, playlists, () => 0.999)).toBe('mix2');
  });

  it('ưu tiên customLink khi genre = custom', () => {
    const settings: PomodoroSettings = {
      workMinutes: 25,
      breakMinutes: 5,
      musicGenre: 'custom',
      customLink: 'https://youtube.com/my-link',
    };
    expect(pickMusicLink(settings, playlists)).toBe('https://youtube.com/my-link');
  });

  it('trả về null nếu genre custom nhưng chưa có link', () => {
    const settings: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'custom' };
    expect(pickMusicLink(settings, playlists)).toBeNull();
  });

  it('trả về null nếu playlist của thể loại rỗng', () => {
    const settings: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'baroque' };
    expect(pickMusicLink(settings, { ...playlists, baroque: [] })).toBeNull();
  });
});
