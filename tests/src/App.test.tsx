import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/App';

function stubElectronAPI() {
  (window as any).electronAPI = {
    getData: vi.fn().mockResolvedValue({
      pomodoroSettings: { workMinutes: 25, breakMinutes: 5, musicGenre: 'pomodoro' },
      playlists: { mixset: [], pomodoro: [], baroque: [] },
      pushTasks: [],
      pushHistory: [],
    }),
    updatePomodoroSettings: vi.fn(),
    startPomodoro: vi.fn(),
    stopPomodoro: vi.fn(),
    getPomodoroState: vi.fn().mockResolvedValue(null),
    playMusic: vi.fn(),
    onPomodoroStateChanged: vi.fn().mockReturnValue(() => {}),
    listTasks: vi.fn().mockResolvedValue([]),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    markTaskDone: vi.fn(),
    deleteTask: vi.fn(),
    onTasksUpdated: vi.fn().mockReturnValue(() => {}),
  };
}

describe('App', () => {
  beforeEach(() => {
    stubElectronAPI();
  });

  it('khung Đầu việc push mở sẵn (expanded) khi mount lần đầu', async () => {
    render(<App />);
    expect(await screen.findByText('Đầu việc cần push')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tên đầu việc')).toBeInTheDocument();
  });

  it('khung Đồng hồ Pomodoro thu gọn (collapsed) khi mount lần đầu', async () => {
    render(<App />);
    expect(await screen.findByText('Đồng hồ Pomodoro')).toBeInTheDocument();
    expect(screen.queryByTestId('pomodoro-clock')).not.toBeInTheDocument();
  });
});
