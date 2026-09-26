import { KeyboardEvent } from 'react';
import { PomodoroSettings } from '../../shared/types';
import { PlayIcon } from '../../shared/icons';

interface MusicSettingsPanelProps {
  settings: PomodoroSettings;
  onChange: (settings: PomodoroSettings) => void;
  onPlay: () => void;
  onEnter: () => void;
}

export function MusicSettingsPanel({ settings, onChange, onPlay, onEnter }: MusicSettingsPanelProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onEnter();
    }
  }

  return (
    <div className="music-settings">
      <input
        aria-label="Link nhạc"
        placeholder="Dán link YouTube"
        value={settings.customLink ?? ''}
        onChange={(e) => onChange({ ...settings, customLink: e.target.value })}
        onKeyDown={handleKeyDown}
      />
      <button type="button" className="icon-btn icon-btn--play" aria-label="Phát nhạc" onClick={onPlay}>
        <PlayIcon />
      </button>
    </div>
  );
}
