import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { PushTaskPanel } from '../../src/features/pushTasks/PushTaskPanel';
import { PushTask } from '../../src/shared/types';

function makeTask(id: string, overrides: Partial<PushTask> = {}): PushTask {
  return {
    id,
    name: `Task ${id}`,
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
    copyToClipboard: vi.fn().mockResolvedValue(undefined),
    resetTasksStart: vi.fn().mockResolvedValue([]),
  };
  (window as any).electronAPI = api;
  render(<PushTaskPanel />);
  await screen.findByText(`Task ${tasks[0].id}`);
}

describe('PushTaskPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ô tên đầu việc nằm trên danh sách task', async () => {
    await renderPanel([makeTask('1')]);
    const nameInput = screen.getByLabelText('Tên đầu việc');
    const row = screen.getByTestId('push-task-row-1');
    expect(nameInput.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('task đã hết chu kỳ setup nhấp nháy đỏ/xanh; task done hoặc còn xa thì không', async () => {
    const HOUR = 3_600_000;
    const expired = makeTask('1', { offsetsHours: [1], cycleStart: Date.now() - 2 * HOUR });
    const doneExpired = makeTask('2', { offsetsHours: [1], cycleStart: Date.now() - 2 * HOUR, done: true });
    const fresh = makeTask('3', { offsetsHours: [1], cycleStart: Date.now() });
    await renderPanel([expired, doneExpired, fresh]);
    expect(screen.getByTestId('push-task-row-1').className).toMatch(/push-task-row--flash-(red|green)/);
    expect(screen.getByTestId('push-task-row-2').className).toBe('push-task-row');
    expect(screen.getByTestId('push-task-row-3').className).toBe('push-task-row');
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
    fireEvent.change(screen.getByLabelText('Mốc nhắc (giờ)'), { target: { value: '3,6,9' } });
    fireEvent.keyDown(screen.getByLabelText('Tên đầu việc'), { key: 'Enter' });
    await waitFor(() =>
      expect(api.addTask).toHaveBeenCalledWith({ name: 'New', offsetsHours: [3, 6, 9] })
    );
    expect(api.updateTask).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText('Tên đầu việc')).toHaveValue(''));
    expect(screen.getByLabelText('Mốc nhắc (giờ)')).toHaveValue('');
  });

  it('sau khi sửa xong (Enter) cả 2 ô được xóa trắng', async () => {
    await renderPanel([makeTask('1')]);
    fireEvent.click(screen.getByLabelText('Sửa giờ push'));
    fireEvent.change(screen.getByLabelText('Tên đầu việc'), { target: { value: 'Renamed' } });
    fireEvent.keyDown(screen.getByLabelText('Tên đầu việc'), { key: 'Enter' });
    await waitFor(() => expect(api.updateTask).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText('Tên đầu việc')).toHaveValue(''));
    expect(screen.getByLabelText('Mốc nhắc (giờ)')).toHaveValue('');
  });

  it('bấm Done thì hiển thị đúng thứ tự danh sách mà main trả về (done xuống cuối)', async () => {
    const a = makeTask('A');
    const b = makeTask('B');
    await renderPanel([a, b]);
    api.markTaskDone.mockResolvedValue([b, { ...a, done: true }]);
    fireEvent.click(within(screen.getByTestId('push-task-row-A')).getByLabelText('Đánh dấu hoàn thành'));
    await waitFor(() => {
      const ids = screen.getAllByTestId(/^push-task-row-/).map((el) => el.getAttribute('data-testid'));
      expect(ids).toEqual(['push-task-row-B', 'push-task-row-A']);
    });
  });

  it('xóa task đang sửa thì thoát chế độ sửa (sau khi xác nhận)', async () => {
    await renderPanel([makeTask('1')]);
    fireEvent.click(screen.getByLabelText('Sửa giờ push'));
    fireEvent.click(screen.getByLabelText('Xóa đầu việc'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Xóa'));
    await waitFor(() => expect(screen.queryByText('Sửa')).not.toBeInTheDocument());
  });

  it('bấm xóa hiện hộp xác nhận, chưa xóa ngay; Hủy thì không xóa', async () => {
    await renderPanel([makeTask('1')]);
    fireEvent.click(screen.getByLabelText('Xóa đầu việc'));
    const dialog = screen.getByRole('dialog', { name: 'Xác nhận' });
    expect(within(dialog).getByText('Xóa đầu việc "Task 1"?')).toBeInTheDocument();
    expect(api.deleteTask).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByText('Hủy'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.deleteTask).not.toHaveBeenCalled();
    expect(screen.getByTestId('push-task-row-1')).toBeInTheDocument();
  });

  it('đồng ý xác nhận mới gọi deleteTask', async () => {
    await renderPanel([makeTask('1')]);
    fireEvent.click(screen.getByLabelText('Xóa đầu việc'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Xóa'));
    await waitFor(() => expect(api.deleteTask).toHaveBeenCalledWith('1'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByTestId('push-task-row-1')).not.toBeInTheDocument());
  });

  it('nút Reset nằm cạnh nút Export; bấm hiện hộp xác nhận, chưa reset ngay', async () => {
    await renderPanel([makeTask('1')]);
    const reset = screen.getByText('Reset');
    const exportBtn = screen.getByText('Export');
    expect(exportBtn.parentElement).toBe(reset.parentElement);
    expect(exportBtn.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId('push-task-row-1')).toBeInTheDocument();

    fireEvent.click(reset);
    const dialog = screen.getByRole('dialog', { name: 'Xác nhận' });
    expect(within(dialog).getByText('Bạn có muốn đặt lại giờ khởi tạo các đầu việc?')).toBeInTheDocument();
    expect(api.resetTasksStart).not.toHaveBeenCalled();
    expect(screen.getByTestId('push-task-row-1')).toBeInTheDocument();
  });

  it('Hủy hộp xác nhận Reset thì không đặt lại', async () => {
    await renderPanel([makeTask('1')]);
    fireEvent.click(screen.getByText('Reset'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Hủy'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.resetTasksStart).not.toHaveBeenCalled();
  });

  it('xác nhận Reset gọi resetTasksStart và hiển thị danh sách đã đặt lại', async () => {
    const before = makeTask('1', { offsetsHours: [1], cycleStart: Date.now() - 2 * 3_600_000 });
    await renderPanel([before]);
    expect(screen.getByTestId('push-task-row-1').className).toMatch(/flash-(red|green)/);

    api.resetTasksStart.mockResolvedValue([{ ...before, cycleStart: Date.now(), pushedOffsetIndexes: [] }]);
    fireEvent.click(screen.getByText('Reset'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Đặt lại'));

    await waitFor(() => expect(api.resetTasksStart).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('push-task-row-1').className).toBe('push-task-row'));
  });

  it('nút Reset bị khóa khi danh sách rỗng và bấm Reset không đóng/mở panel', async () => {
    api = {
      listTasks: vi.fn().mockResolvedValue([]),
      onTasksUpdated: vi.fn().mockReturnValue(() => {}),
    };
    (window as any).electronAPI = api;
    render(<PushTaskPanel />);
    await waitFor(() => expect(api.listTasks).toHaveBeenCalled());
    expect(screen.getByText('Reset')).toBeDisabled();
    expect(screen.getByLabelText('Tên đầu việc')).toBeInTheDocument();
  });

  it('nút Export cạnh badge mở popup danh sách (done trước) và không đóng panel', async () => {
    const tasks = [makeTask('1'), makeTask('2', { done: true })];
    await renderPanel(tasks);
    fireEvent.click(screen.getByText('Export'));
    const dialog = screen.getByRole('dialog', { name: 'Export' });
    const text = within(dialog).getByTestId('export-text').textContent!;
    expect(text.split('\n')[0]).toBe('1. Task 2. Done');
    expect(text.split('\n')[1]).toMatch(/^2\. Task 1\. Progress\. [\d.]+ (phút|tiếng) \/ 3,6,9$/);
    expect(screen.getByTestId('push-task-row-1')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByText('Copy to Clipboard'));
    await waitFor(() => expect(api.copyToClipboard).toHaveBeenCalledWith(text));
  });

  it('công việc đã xóa không còn trong Export', async () => {
    const remaining = makeTask('2');
    await renderPanel([makeTask('1'), remaining]);
    api.deleteTask.mockResolvedValue([remaining]);

    fireEvent.click(within(screen.getByTestId('push-task-row-1')).getByLabelText('Xóa đầu việc'));
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Xóa'));
    await waitFor(() => expect(screen.queryByTestId('push-task-row-1')).not.toBeInTheDocument());

    fireEvent.click(screen.getByText('Export'));
    const text = within(screen.getByRole('dialog')).getByTestId('export-text').textContent!;
    expect(text).toMatch(/^1\. Task 2\. Progress\./);
    expect(text).not.toContain('Task 1');
  });
});
