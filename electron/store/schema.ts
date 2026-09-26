export type Genre = 'mixset' | 'pomodoro' | 'baroque' | 'custom';

export interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  musicGenre: Genre;
  customLink?: string;
}

export interface Playlists {
  mixset: string[];
  pomodoro: string[];
  baroque: string[];
}

export interface PushTask {
  id: string;
  name: string;
  offsetsHours: number[];
  cycleStart: number;
  pushedOffsetIndexes: number[];
  done: boolean;
  colorIndex: number;
}

export interface PushHistoryEntry {
  taskId: string;
  pushedAt: number;
}

export interface AppData {
  pomodoroSettings: PomodoroSettings;
  playlists: Playlists;
  pushTasks: PushTask[];
  pushHistory: PushHistoryEntry[];
}

export const DEFAULT_PLAYLISTS: Playlists = {
  mixset: [
    'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    'https://www.youtube.com/watch?v=5qap5aO4i9A',
  ],
  pomodoro: [
    'https://www.youtube.com/watch?v=eKFTSSKCzWA',
    'https://www.youtube.com/watch?v=1oDrJba2PSs',
  ],
  baroque: [
    'https://www.youtube.com/watch?v=GRxofEmo3HA',
    'https://www.youtube.com/watch?v=lFrSaCz1CS0',
  ],
};

export function createDefaultAppData(): AppData {
  return {
    pomodoroSettings: {
      workMinutes: 25,
      breakMinutes: 5,
      musicGenre: 'pomodoro',
    },
    playlists: DEFAULT_PLAYLISTS,
    pushTasks: [],
    pushHistory: [],
  };
}
