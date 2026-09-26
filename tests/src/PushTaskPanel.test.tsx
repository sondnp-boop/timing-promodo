import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PushTaskPanel } from '../../src/features/pushTasks/PushTaskPanel';
import { PushTask } from '../../src/shared/types';

function makeTask(id: string, overrides: Partial<PushTask> = {}): PushTask {
  return {
    id,
    name: `Task ${id}`,
    cycleHours: 24,
    offsetsHours: [3, 6, 9],
    cycleStart: 1000,
    pushedOffsetIndexes: [1],
    done: false,
    colorIndex: 0,
    ...overrides,
  };
}

let api: Record<string, ReturnType<typeof vi.fn>>;

async function renderPanel(tasks: PushTask[]) {
  api = {
    listTasks: vi.fn().mockResolvedValue(tasks),
    onTasksUpdated: vi.fn().mockReturnValue(() => {}),
    addTask: vi.fn().mockResolvedValue(tasks),
    updateTask: vi.fn().mockResolvedValue(tasks),
    markTaskDone: vi.fn().mockResolvedValue(tasks),
    deleteTask: vi.fn().mockResolvedValue([]),
  };
  (window as any).electronAPI = api;
  render(<PushTaskPanel />);
  await screen.findByText(`Task ${tasks[0].id}`);
}

describe('PushTaskPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('badge hiển thị số việc chưa xong', async () => {
    await renderPanel([makeTask('1'), makeTask('2', { done: true }), makeTask('3')]);
    expect(screen.getByTestId('panel-badge')).toHaveTextContent('2');
  });

  it('bấm Sửa điền form + nhãn Sửa; đổi tên giữ nguyên tiến độ chu kỳ', async () => {
    const task = makeTask('1');
    await renderPanel([task]);
    fireEvent.click(screen.getByLabelText('Sửa giờ push'));
    expect(screen.getByText('Sửa')).toBeInTheDocument();
    const name = screen.getByLabelText('Tên đầu việc');
    expect(name).toHaveValue('Task 1');
    expect(screen.getByLabelText('Mốc nhắc (giờ)')).toHaveValue('3,6,9');

    fireEvent.change(name, { target: { value: 'Renamed' } });
    fireEvent.keyDown(name, { key: 'Enter' });

    await waitFor(() => expect(api.updateTask).toHaveBeenCalledTimes(1));
    expect(api.updateTask).toHaveBeenCalledWith({ ...task, name: 'Renamed' });
    expect(api.addTask).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Sửa')).not.toBeInTheDocument());
  });

  it('đổi mốc giờ thì reset chu kỳ', async () => {
    const task = makeTask('1');
    await renderPanel([task]);
    fireEvent.click(screen.getByLabelText('Sửa giờ push'));
    fireEvent.change(screen.getByLabelText('Mốc nhắc (giờ)'), { target: { value: '1,2' } });
    fireEvent.keyDown(screen.getByLabelText('Tên đầu việc'), { key: 'Enter' });

    await waitFor(() => expect(api.updateTask).toHaveBeenCalledTimes(1));
    const sent = api.updateTask.mock.calls[0][0] as PushTask;
    expect(sent.offsetsHours).toEqual([1, 2]);
    expect(sent.pushedOffsetIndexes).toEqual([]);
    expect(sent.cycleStart).toBeGreaterThan(task.cycleStart);
  });

  it('không ở chế độ sửa thì Enter vẫn thêm mới', async () => {
    await renderPanel([makeTask('1')]);
    fireEvent.change(screen.getByLabelText('Tên đầu việc'), { target: { value: 'New' } });
    fireEvent.keyDown(screen.getByLabelText('Tên đầu việc'), { key: 'Enter' });
    await waitFor(() =>
      expect(api.addTask).toHaveBeenCalledWith({ name: 'New', offsetsHours: [3, 6, 9], cycleHours: 24 })
    );
    expect(api.updateTask).not.toHaveBeenCalled();
  });

  it('xóa task đang sửa thì thoát chế độ sửa', async () => {
    await renderPanel([makeTask('1')]);
    fireEvent.click(screen.getByLabelText('Sửa giờ push'));
    fireEvent.click(screen.getByLabelText('Xóa đầu việc'));
    await waitFor(() => expect(screen.queryByText('Sửa')).not.toBeInTheDocument());
  });
});
