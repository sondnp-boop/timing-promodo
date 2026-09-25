import { Genre, PomodoroSettings } from '../../shared/types';

interface MusicSettingsPanelProps {
  settings: PomodoroSettings;
  onChange: (settings: PomodoroSettings) => void;
}

const GENRES: Genre[] = ['mixset', 'pomodoro', 'baroque', 'custom'];

export function MusicSettingsPanel({ settings, onChange }: MusicSettingsPanelProps) {
  return (
    <div className="music-settings">
      <select
        aria-label="Thể loại nhạc"
        value={settings.musicGenre}
        onChange={(e) => onChange({ ...settings, musicGenre: e.target.value as Genre })}
      >
        {GENRES.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>
      {settings.musicGenre === 'custom' && (
        <input
          placeholder="Dán link YouTube"
          value={settings.customLink ?? ''}
          onChange={(e) => onChange({ ...settings, customLink: e.target.value })}
        />
      )}
    </div>
  );
}
