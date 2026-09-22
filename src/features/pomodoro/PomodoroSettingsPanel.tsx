import { PomodoroSettings } from '../../shared/types';

interface PomodoroSettingsPanelProps {
  settings: PomodoroSettings;
  onChange: (settings: PomodoroSettings) => void;
}

export function PomodoroSettingsPanel({ settings, onChange }: PomodoroSettingsPanelProps) {
  return (
    <div className="pomodoro-settings">
      <label>
        Thời gian làm (phút)
        <input
          type="number"
          value={settings.workMinutes}
          onChange={(e) => onChange({ ...settings, workMinutes: Number(e.target.value) })}
        />
      </label>
      <label>
        Thời gian nghỉ (phút)
        <input
          type="number"
          value={settings.breakMinutes}
          onChange={(e) => onChange({ ...settings, breakMinutes: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
