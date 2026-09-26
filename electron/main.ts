import { app, BrowserWindow, Tray, screen } from 'electron';
import * as path from 'node:path';
import { JsonStore } from './store/jsonStore';
import { registerIpcHandlers } from './ipc';

const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 560;
const MARGIN = 16;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): void {
  const { workArea } = screen.getPrimaryDisplay();
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: workArea.x + workArea.width - WINDOW_WIDTH - MARGIN,
    y: workArea.y + MARGIN,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function createTray(): void {
  tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'));
  tray.setToolTip('Pomodoro Push Widget');
  tray.on('click', () => {
    if (!mainWindow) {
      return;
    }
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

app.whenReady().then(() => {
  const store = new JsonStore(app.getPath('userData'));
  createWindow();
  try {
    createTray();
  } catch {
    // Icon có thể chưa tồn tại trong môi trường dev ban đầu — không chặn khởi động app.
  }
  registerIpcHandlers(store, () => mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
