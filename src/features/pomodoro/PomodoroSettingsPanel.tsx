import { useState } from 'react';
import { PomodoroSettings } from '../../shared/types';

interface PomodoroSettingsPanelProps {
  settings: PomodoroSettings;
  onChange: (settings: PomodoroSettings) => void;
  onEnter: () => void;
}

export function parseWorkBreak(text: string): { work: number; rest: number } | null {
  const match = text.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) {
    return null;
  }
  const work = Number(match[1]);
  const rest = Number(match[2]);
  return work > 0 && rest > 0 ? { work, rest } : null;
}

export function PomodoroSettingsPanel({ settings, onChange, onEnter }: PomodoroSettingsPanelProps) {
  const [text, setText] = useState(`${settings.workMinutes}/${settings.breakMinutes}`);

  function handleChange(value: string) {
    setText(value);
    const parsed = parseWorkBreak(value);
    if (parsed) {
      onChange({ ...settings, workMinutes: parsed.work, breakMinutes: parsed.rest });
    }
  }

  return (
    <div className="pomodoro-settings">
      <input
        aria-label="Thời gian làm/nghỉ (phút)"
        placeholder="làm/nghỉ, vd 30/5"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter();
          }
        }}
      />
    </div>
  );
}
