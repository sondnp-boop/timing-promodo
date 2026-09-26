import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from '../../src/features/pushTasks/ExportDialog';
import { PushTask } from '../../src/shared/types';

const HOUR = 3_600_000;

function task(id: string, overrides: Partial<PushTask> = {}): PushTask {
  return {
    id,
    name: `Việc ${id}`,
    offsetsHours: [1, 2, 3],
    cycleStart: 0,
    pushedOffsetIndexes: [],
    done: false,
    colorIndex: 0,
    ...overrides,
  };
}

let copyToClipboard: ReturnType<typeof vi.fn>;

beforeEach(() => {
  copyToClipboard = vi.fn().mockResolvedValue(undefined);
  (window as any).electronAPI = { copyToClipboard };
});

describe('ExportDialog', () => {
  it('liệt kê đầu việc: done trước rồi Progress kèm thời gian trôi qua / chu kỳ', () => {
    render(
      <ExportDialog tasks={[task('B'), task('A', { done: true })]} now={0.5 * HOUR} onClose={vi.fn()} />
    );
    expect(screen.getByTestId('export-text').textContent).toBe(
      '1. Việc A. Done\n2. Việc B. Progress. 30 phút / 1,2,3'
    );
  });

  it('Copy to Clipboard gửi toàn bộ nội dung và báo đã copy', async () => {
    render(<ExportDialog tasks={[task('B'), task('A', { done: true })]} now={0} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Copy to Clipboard'));
    await waitFor(() =>
      expect(copyToClipboard).toHaveBeenCalledWith('1. Việc A. Done\n2. Việc B. Progress. 0 phút / 1,2,3')
    );
    expect(await screen.findByText('Đã copy!')).toBeInTheDocument();
  });

  it('không có đầu việc: hiện thông báo rỗng và khóa nút Copy', () => {
    render(<ExportDialog tasks={[]} now={0} onClose={vi.fn()} />);
    expect(screen.getByText('Chưa có đầu việc nào.')).toBeInTheDocument();
    expect(screen.getByText('Copy to Clipboard')).toBeDisabled();
  });

  it('nút Đóng gọi onClose', () => {
    const onClose = vi.fn();
    render(<ExportDialog tasks={[]} now={0} onClose={onClose} />);
    fireEvent.click(screen.getByText('Đóng'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
