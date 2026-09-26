import type { AppData, PomodoroSettings, PomodoroState, PushTask } from '../shared/types';

interface ElectronAPI {
  getData(): Promise<AppData>;
  minimizeWindow(): Promise<void>;
  updatePomodoroSettings(settings: PomodoroSettings): Promise<PomodoroSettings>;
  startPomodoro(phase: 'work' | 'break'): Promise<PomodoroState>;
  stopPomodoro(): Promise<null>;
  getPomodoroState(): Promise<PomodoroState | null>;
  playMusic(): Promise<string | null>;
  onPomodoroStateChanged(callback: (state: PomodoroState) => void): () => void;
  listTasks(): Promise<PushTask[]>;
  addTask(
    task: Omit<PushTask, 'id' | 'cycleStart' | 'pushedOffsetIndexes' | 'done' | 'colorIndex'>
  ): Promise<PushTask[]>;
  updateTask(task: PushTask): Promise<PushTask[]>;
  markTaskDone(id: string): Promise<PushTask[]>;
  deleteTask(id: string): Promise<PushTask[]>;
  onTasksPushed(callback: (taskIds: string[]) => void): () => void;
  onTasksUpdated(callback: (tasks: PushTask[]) => void): () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export function getElectronApi(): ElectronAPI {
  return window.electronAPI;
}
