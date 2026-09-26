import { useEffect, useState } from 'react';
import { CollapsiblePanel } from '../../shared/CollapsiblePanel';
import { PomodoroClock } from './PomodoroClock';
import { PomodoroSettingsPanel } from './PomodoroSettingsPanel';
import { MusicSettingsPanel } from './MusicSettingsPanel';
import { getElectronApi } from '../../api/electronApi';
import { PomodoroSettings, PomodoroState } from '../../shared/types';

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  musicGenre: 'pomodoro',
};

export function PomodoroPanel() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<PomodoroState | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const api = getElectronApi();
    api.getData().then((data) => setSettings(data.pomodoroSettings));
    api.getPomodoroState().then(setState);
    const unsubscribe = api.onPomodoroStateChanged(setState);
    const clockId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      unsubscribe();
      clearInterval(clockId);
    };
  }, []);

  async function handleSettingsChange(next: PomodoroSettings) {
    setSettings(next);
    const api = getElectronApi();
    await api.updatePomodoroSettings(next);
  }

  async function handleStart(phase: 'work' | 'break') {
    const api = getElectronApi();
    setState(await api.startPomodoro(phase));
  }

  async function handleStop() {
    const api = getElectronApi();
    setState(await api.stopPomodoro());
  }

  return (
    <CollapsiblePanel title="Đồng hồ Pomodoro" defaultExpanded={false}>
      <PomodoroClock state={state} now={now} onStart={handleStart} onStop={handleStop} />
      <div className="pomodoro-controls">
        <PomodoroSettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onEnter={() => handleStart('work')}
        />
        <MusicSettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onPlay={() => getElectronApi().playMusic()}
          onEnter={() => handleStart('work')}
        />
      </div>
    </CollapsiblePanel>
  );
}
