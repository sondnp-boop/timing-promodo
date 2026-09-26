import { PomodoroSettings, Playlists } from '../../store/schema';

export function pickMusicLink(
  settings: PomodoroSettings,
  playlists: Playlists,
  random: () => number = Math.random
): string | null {
  const custom = settings.customLink?.trim();
  if (custom) {
    return /^https?:\/\//i.test(custom) ? custom : null;
  }
  if (settings.musicGenre === 'custom') {
    return null;
  }
  const list = playlists[settings.musicGenre];
  if (!list || list.length === 0) {
    return null;
  }
  return list[Math.floor(random() * list.length)];
}
