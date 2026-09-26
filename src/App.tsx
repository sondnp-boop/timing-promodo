import { PushTaskPanel } from './features/pushTasks/PushTaskPanel';
import { PomodoroPanel } from './features/pomodoro/PomodoroPanel';
import { TitleBar } from './shared/TitleBar';
import './App.css';

export function App() {
  return (
    <div className="app">
      <TitleBar />
      <PomodoroPanel />
      <PushTaskPanel />
    </div>
  );
}
