import { BrowserWindow, ipcMain, shell } from 'electron';
import { JsonStore } from './store/jsonStore';
import { AppData, PomodoroSettings, PushTask } from './store/schema';
import { PomodoroState, startPhase, tick } from './modules/pomodoro/pomodoroEngine';
import { pickMusicLink } from './modules/pomodoro/musicPicker';
import { processDueTasks, sortByNextPush } from './modules/pushTasks/pushTaskEngine';
import { pruneHistory } from './modules/pushTasks/historyPruner';
import { showNotification } from './notifications';

const TICK_INTERVAL_MS = 1000;

export function registerIpcHandlers(store: JsonStore, getWindow: () => BrowserWindow | null): void {
  let data: AppData = store.load();
  data.pushHistory = pruneHistory(data.pushHistory, Date.now());
  store.save(data);

  let pomodoroState: PomodoroState | null = null;

  function persist(): void {
    store.save(data);
  }

  function checkPushTasksDue(): void {
    const now = Date.now();
    const { tasks, pushedTaskIds } = processDueTasks(data.pushTasks, now);
    if (pushedTaskIds.length === 0) {
      return;
    }
    data = {
      ...data,
      pushTasks: tasks,
      pushHistory: [
        ...data.pushHistory,
        ...pushedTaskIds.map((taskId) => ({ taskId, pushedAt: now })),
      ],
    };
    for (const taskId of pushedTaskIds) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        showNotification('Đến giờ push công việc', `${task.name} — người push: ${task.pusher}`);
      }
    }
    persist();
    getWindow()?.webContents.send('tasks:updated', sortByNextPush(data.pushTasks));
  }

  setInterval(() => {
    checkPushTasksDue();
    if (pomodoroState) {
      const next = tick(pomodoroState, data.pomodoroSettings, Date.now());
      if (next) {
        pomodoroState = next;
        showNotification(
          next.phase === 'work' ? 'Bắt đầu làm việc' : 'Đến giờ nghỉ',
          next.phase === 'work' ? 'Hết giờ nghỉ, quay lại làm việc nào!' : 'Đã đến giờ nghỉ giải lao.'
        );
        getWindow()?.webContents.send('pomodoro:stateChanged', pomodoroState);
      }
    }
  }, TICK_INTERVAL_MS);

  ipcMain.handle('data:get', () => data);

  ipcMain.handle('pomodoro:updateSettings', (_e, settings: PomodoroSettings) => {
    data = { ...data, pomodoroSettings: settings };
    persist();
    return data.pomodoroSettings;
  });

  ipcMain.handle('pomodoro:start', (_e, phase: 'work' | 'break') => {
    pomodoroState = startPhase(phase, data.pomodoroSettings, Date.now());
    return pomodoroState;
  });

  ipcMain.handle('pomodoro:stop', () => {
    pomodoroState = null;
    return null;
  });

  ipcMain.handle('pomodoro:getState', () => pomodoroState);

  ipcMain.handle('pomodoro:playMusic', () => {
    const link = pickMusicLink(data.pomodoroSettings, data.playlists);
    if (link) {
      shell.openExternal(link);
    }
    return link;
  });

  ipcMain.handle('tasks:list', () => sortByNextPush(data.pushTasks));

  ipcMain.handle('tasks:add', (_e, task: Omit<PushTask, 'id' | 'cycleStart' | 'pushedOffsetIndexes' | 'done' | 'colorIndex'>) => {
    const newTask: PushTask = {
      ...task,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      cycleStart: Date.now(),
      pushedOffsetIndexes: [],
      done: false,
      colorIndex: data.pushTasks.length,
    };
    data = { ...data, pushTasks: [...data.pushTasks, newTask] };
    persist();
    return sortByNextPush(data.pushTasks);
  });

  ipcMain.handle('tasks:update', (_e, task: PushTask) => {
    data = {
      ...data,
      pushTasks: data.pushTasks.map((t) => (t.id === task.id ? task : t)),
    };
    persist();
    return sortByNextPush(data.pushTasks);
  });

  ipcMain.handle('tasks:markDone', (_e, id: string) => {
    data = {
      ...data,
      pushTasks: data.pushTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    };
    persist();
    return sortByNextPush(data.pushTasks);
  });

  ipcMain.handle('tasks:delete', (_e, id: string) => {
    data = { ...data, pushTasks: data.pushTasks.filter((t) => t.id !== id) };
    persist();
    return sortByNextPush(data.pushTasks);
  });
}
