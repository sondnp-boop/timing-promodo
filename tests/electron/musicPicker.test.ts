import { describe, expect, it } from 'vitest';
import { pickMusicLink } from '../../electron/modules/pomodoro/musicPicker';
import { Playlists, PomodoroSettings } from '../../electron/store/schema';

const playlists: Playlists = {
  mixset: ['mix1', 'mix2'],
  pomodoro: ['pomo1', 'pomo2', 'pomo3'],
  baroque: ['baroque1'],
};

const base: PomodoroSettings = { workMinutes: 25, breakMinutes: 5, musicGenre: 'pomodoro' };

describe('musicPicker', () => {
  it('URL nhập tay được ưu tiên bất kể genre', () => {
    const settings = { ...base, customLink: ' https://youtube.com/my-link ' };
    expect(pickMusicLink(settings, playlists)).toBe('https://youtube.com/my-link');
    expect(pickMusicLink({ ...settings, musicGenre: 'custom' }, playlists)).toBe('https://youtube.com/my-link');
  });

  it('từ chối URL không phải http(s)', () => {
    expect(pickMusicLink({ ...base, customLink: 'file:///etc/passwd' }, playlists)).toBeNull();
    expect(pickMusicLink({ ...base, customLink: 'abc' }, playlists)).toBeNull();
  });

  it('URL rỗng thì chọn ngẫu nhiên trong playlist của genre', () => {
    expect(pickMusicLink(base, playlists, () => 0)).toBe('pomo1');
    expect(pickMusicLink(base, playlists, () => 0.999)).toBe('pomo3');
    expect(pickMusicLink({ ...base, customLink: '   ' }, playlists, () => 0.5)).toBe('pomo2');
  });

  it('genre custom mà không có link thì null', () => {
    expect(pickMusicLink({ ...base, musicGenre: 'custom' }, playlists)).toBeNull();
  });

  it('trả về null nếu playlist của thể loại rỗng', () => {
    expect(pickMusicLink({ ...base, musicGenre: 'baroque' }, { ...playlists, baroque: [] })).toBeNull();
  });
});
