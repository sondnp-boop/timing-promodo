import { PushTaskPanel } from './features/pushTasks/PushTaskPanel';
import { PomodoroPanel } from './features/pomodoro/PomodoroPanel';
import './App.css';

export function App() {
  return (
    <div className="app">
      <PushTaskPanel />
      <PomodoroPanel />
    </div>
  );
}
