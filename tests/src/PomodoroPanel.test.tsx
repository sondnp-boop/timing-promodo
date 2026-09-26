import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PomodoroPanel } from '../../src/features/pomodoro/PomodoroPanel';

let api: Record<string, ReturnType<typeof vi.fn>>;

async function renderOpenPanel() {
  api = {
    getData: vi.fn().mockResolvedValue({
      pomodoroSettings: { workMinutes: 25, breakMinutes: 5, musicGenre: 'pomodoro' },
    }),
    getPomodoroState: vi.fn().mockResolvedValue(null),
    onPomodoroStateChanged: vi.fn().mockReturnValue(() => {}),
    updatePomodoroSettings: vi.fn().mockResolvedValue({}),
    startPomodoro: vi.fn().mockResolvedValue({ phase: 'work', phaseEndsAt: Date.now() + 60_000, running: true }),
    stopPomodoro: vi.fn().mockResolvedValue(null),
    playMusic: vi.fn().mockResolvedValue(null),
  };
  (window as any).electronAPI = api;
  render(<PomodoroPanel />);
  fireEvent.click(screen.getByText('Đồng hồ Pomodoro'));
  await waitFor(() => expect(api.getData).toHaveBeenCalled());
}

describe('PomodoroPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ô giờ làm/nghỉ, ô URL và nút Play cùng một dòng theo thứ tự', async () => {
    await renderOpenPanel();
    const row = document.querySelector('.pomodoro-controls')!;
    const time = screen.getByLabelText('Thời gian làm/nghỉ (phút)');
    const url = screen.getByLabelText('Link nhạc');
    const play = screen.getByLabelText('Phát nhạc');
    [time, url, play].forEach((el) => expect(row).toContainElement(el));
    expect(time.compareDocumentPosition(url) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(url.compareDocumentPosition(play) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Enter trong ô làm/nghỉ bắt đầu chạy pha làm việc', async () => {
    await renderOpenPanel();
    fireEvent.keyDown(screen.getByLabelText('Thời gian làm/nghỉ (phút)'), { key: 'Enter' });
    await waitFor(() => expect(api.startPomodoro).toHaveBeenCalledWith('work'));
  });

  it('Enter trong ô URL bắt đầu chạy pha làm việc', async () => {
    await renderOpenPanel();
    fireEvent.keyDown(screen.getByLabelText('Link nhạc'), { key: 'Enter' });
    await waitFor(() => expect(api.startPomodoro).toHaveBeenCalledWith('work'));
  });

  it('bấm Start không tự mở nhạc', async () => {
    await renderOpenPanel();
    fireEvent.click(screen.getByText('Start'));
    await waitFor(() => expect(api.startPomodoro).toHaveBeenCalledWith('work'));
    expect(api.playMusic).not.toHaveBeenCalled();
  });

  it('nút Start đổi thành Stop khi đang chạy; bấm Stop gọi stopPomodoro', async () => {
    await renderOpenPanel();
    fireEvent.click(screen.getByText('Start'));
    const stop = await screen.findByText('Stop');
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
    fireEvent.click(stop);
    await waitFor(() => expect(api.stopPomodoro).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Start')).toBeInTheDocument();
  });

  it('nút Start/Stop đứng đầu dòng điều khiển, trước ô giờ, URL, Play', async () => {
    await renderOpenPanel();
    const row = document.querySelector('.pomodoro-controls')!;
    const toggle = screen.getByText('Start');
    expect(row).toContainElement(toggle);
    expect(toggle.compareDocumentPosition(screen.getByLabelText('Thời gian làm/nghỉ (phút)'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('chỉ bấm Play mới gọi playMusic', async () => {
    await renderOpenPanel();
    fireEvent.click(screen.getByLabelText('Phát nhạc'));
    await waitFor(() => expect(api.playMusic).toHaveBeenCalledTimes(1));
    expect(api.startPomodoro).not.toHaveBeenCalled();
  });
});
