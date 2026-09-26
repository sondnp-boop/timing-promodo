import { contextBridge, ipcRenderer } from 'electron';
import { AppData, PomodoroSettings, PushTask } from './store/schema';
import { PomodoroState } from './modules/pomodoro/pomodoroEngine';

const electronAPI = {
  getData: (): Promise<AppData> => ipcRenderer.invoke('data:get'),
  copyToClipboard: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write', text),
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  updatePomodoroSettings: (settings: PomodoroSettings): Promise<PomodoroSettings> =>
    ipcRenderer.invoke('pomodoro:updateSettings', settings),
  startPomodoro: (phase: 'work' | 'break'): Promise<PomodoroState> => ipcRenderer.invoke('pomodoro:start', phase),
  stopPomodoro: (): Promise<null> => ipcRenderer.invoke('pomodoro:stop'),
  getPomodoroState: (): Promise<PomodoroState | null> => ipcRenderer.invoke('pomodoro:getState'),
  playMusic: (): Promise<string | null> => ipcRenderer.invoke('pomodoro:playMusic'),
  onPomodoroStateChanged: (callback: (state: PomodoroState) => void) => {
    const listener = (_e: unknown, state: PomodoroState) => callback(state);
    ipcRenderer.on('pomodoro:stateChanged', listener);
    return () => ipcRenderer.removeListener('pomodoro:stateChanged', listener);
  },

  listTasks: (): Promise<PushTask[]> => ipcRenderer.invoke('tasks:list'),
  addTask: (
    task: Omit<PushTask, 'id' | 'cycleStart' | 'pushedOffsetIndexes' | 'done' | 'colorIndex'>
  ): Promise<PushTask[]> => ipcRenderer.invoke('tasks:add', task),
  updateTask: (task: PushTask): Promise<PushTask[]> => ipcRenderer.invoke('tasks:update', task),
  markTaskDone: (id: string): Promise<PushTask[]> => ipcRenderer.invoke('tasks:markDone', id),
  deleteTask: (id: string): Promise<PushTask[]> => ipcRenderer.invoke('tasks:delete', id),
  onTasksUpdated: (callback: (tasks: PushTask[]) => void) => {
    const listener = (_e: unknown, tasks: PushTask[]) => callback(tasks);
    ipcRenderer.on('tasks:updated', listener);
    return () => ipcRenderer.removeListener('tasks:updated', listener);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
