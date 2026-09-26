import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PushTaskRow } from '../../src/features/pushTasks/PushTaskRow';
import { PushTask } from '../../src/shared/types';
import { TASK_COLOR_PALETTE } from '../../src/shared/colorPalette';

function makeTask(overrides: Partial<PushTask> = {}): PushTask {
  return {
    id: 't1',
    name: 'Task A',
    cycleHours: 24,
    offsetsHours: [3, 6, 9],
    cycleStart: 0,
    pushedOffsetIndexes: [],
    done: false,
    colorIndex: 0,
    ...overrides,
  };
}

describe('PushTaskRow', () => {
  it('hiển thị tên và progress bar đúng màu theo colorIndex', () => {
    const task = makeTask({ colorIndex: 2 });
    render(
      <PushTaskRow task={task} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />
    );
    expect(screen.getByText('Task A')).toBeInTheDocument();
    const bar = screen.getByTestId('progress-t1').firstChild as HTMLElement;
    expect(bar.style.backgroundColor).toBeTruthy();
    expect(TASK_COLOR_PALETTE).toContain(rgbToHex(bar.style.backgroundColor));
  });

  it('màu lặp lại sau 8 dòng (colorIndex mod 8 giống nhau thì màu giống nhau)', () => {
    const taskA = makeTask({ id: 'a', colorIndex: 1 });
    const taskB = makeTask({ id: 'b', colorIndex: 9 });
    const { rerender } = render(
      <PushTaskRow task={taskA} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />
    );
    const colorA = (screen.getByTestId('progress-a').firstChild as HTMLElement).style.backgroundColor;
    rerender(<PushTaskRow task={taskB} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />);
    const colorB = (screen.getByTestId('progress-b').firstChild as HTMLElement).style.backgroundColor;
    expect(colorA).toBe(colorB);
  });

  it('gọi onToggleDone khi bấm nút Done', () => {
    const onToggleDone = vi.fn();
    const task = makeTask();
    render(
      <PushTaskRow task={task} now={0} onToggleDone={onToggleDone} onDelete={vi.fn()} onEditOffsets={vi.fn()} />
    );
    fireEvent.click(screen.getByLabelText('Đánh dấu hoàn thành'));
    expect(onToggleDone).toHaveBeenCalledWith('t1');
  });

  it('gọi onDelete khi bấm nút Xóa', () => {
    const onDelete = vi.fn();
    const task = makeTask();
    render(<PushTaskRow task={task} now={0} onToggleDone={vi.fn()} onDelete={onDelete} onEditOffsets={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Xóa đầu việc'));
    expect(onDelete).toHaveBeenCalledWith('t1');
  });

  it('gọi onEditOffsets khi bấm icon sửa giờ và 3 icon nằm cùng dòng với thông tin task', () => {
    const onEditOffsets = vi.fn();
    render(
      <PushTaskRow task={makeTask()} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={onEditOffsets} />
    );
    const edit = screen.getByLabelText('Sửa giờ push');
    fireEvent.click(edit);
    expect(onEditOffsets).toHaveBeenCalledWith('t1');
    const top = screen.getByText('Task A').closest('.push-task-row__top')!;
    expect(top).toContainElement(edit);
    expect(top).toContainElement(screen.getByLabelText('Xóa đầu việc'));
    expect(top).toContainElement(screen.getByLabelText('Đánh dấu hoàn thành'));
  });

  it('hiển thị "Còn x phút" khi < 1 giờ và "Còn x tiếng" khi >= 1 giờ', () => {
    const task = makeTask({ offsetsHours: [3] });
    const HOUR = 3_600_000;
    const { rerender } = render(
      <PushTaskRow task={task} now={2.5 * HOUR} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />
    );
    expect(screen.getByText('Còn 30 phút')).toBeInTheDocument();
    rerender(<PushTaskRow task={task} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />);
    expect(screen.getByText('Còn 3 tiếng')).toBeInTheDocument();
  });

  it('nhấp nháy vàng/trắng mỗi giây trong 10 giây rồi về giao diện mặc định', () => {
    const task = makeTask();
    const testId = 'push-task-row-t1';
    const renderAt = (now: number) =>
      render(
        <PushTaskRow
          task={task}
          now={now}
          flashStartedAt={5000}
          onToggleDone={vi.fn()}
          onDelete={vi.fn()}
          onEditOffsets={vi.fn()}
        />
      );

    const cases: [number, string | null][] = [
      [5000, 'push-task-row--flash-yellow'],
      [6000, 'push-task-row--flash-white'],
      [7000, 'push-task-row--flash-yellow'],
      [14_999, 'push-task-row--flash-white'],
      [15_000, null],
    ];
    for (const [now, cls] of cases) {
      const { unmount } = renderAt(now);
      const row = screen.getByTestId(testId);
      if (cls) {
        expect(row).toHaveClass(cls);
      } else {
        expect(row.className).toBe('push-task-row');
      }
      unmount();
    }
  });

  it('không nhấp nháy khi không có flashStartedAt', () => {
    render(<PushTaskRow task={makeTask()} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />);
    expect(screen.getByTestId('push-task-row-t1').className).toBe('push-task-row');
  });

  it('hiển thị "Đã hoàn tất chu kỳ" khi đã push hết offset', () => {
    const task = makeTask({ pushedOffsetIndexes: [0, 1, 2] });
    render(<PushTaskRow task={task} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />);
    expect(screen.getByText('Đã hoàn tất chu kỳ')).toBeInTheDocument();
  });
});

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;
  const [, r, g, b] = match;
  return `#${[r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
}
