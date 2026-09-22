import { PomodoroSettings, Playlists } from '../../store/schema';

export function pickMusicLink(
  settings: PomodoroSettings,
  playlists: Playlists,
  random: () => number = Math.random
): string | null {
  if (settings.musicGenre === 'custom') {
    return settings.customLink ?? null;
  }
  const list = playlists[settings.musicGenre];
  if (!list || list.length === 0) {
    return null;
  }
  const index = Math.floor(random() * list.length);
  return list[index];
}
