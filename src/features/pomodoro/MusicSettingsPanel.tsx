import { Genre, PomodoroSettings } from '../../shared/types';

interface MusicSettingsPanelProps {
  settings: PomodoroSettings;
  onChange: (settings: PomodoroSettings) => void;
  onPlay: () => void;
}

const GENRES: Genre[] = ['mixset', 'pomodoro', 'baroque', 'custom'];

export function MusicSettingsPanel({ settings, onChange, onPlay }: MusicSettingsPanelProps) {
  return (
    <div className="music-settings">
      <label>
        Thể loại nhạc
        <select
          value={settings.musicGenre}
          onChange={(e) => onChange({ ...settings, musicGenre: e.target.value as Genre })}
        >
          {GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </label>
      {settings.musicGenre === 'custom' && (
        <input
          placeholder="Dán link YouTube"
          value={settings.customLink ?? ''}
          onChange={(e) => onChange({ ...settings, customLink: e.target.value })}
        />
      )}
      <button type="button" onClick={onPlay}>
        Phát nhạc
      </button>
    </div>
  );
}
