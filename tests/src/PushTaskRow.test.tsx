import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PushTaskRow } from '../../src/features/pushTasks/PushTaskRow';
import { PushTask } from '../../src/shared/types';
import { TASK_COLOR_PALETTE } from '../../src/shared/colorPalette';

function makeTask(overrides: Partial<PushTask> = {}): PushTask {
  return {
    id: 't1',
    name: 'Task A',
    pusher: 'Alice',
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
  it('hiển thị tên, người push và progress bar đúng màu theo colorIndex', () => {
    const task = makeTask({ colorIndex: 2 });
    render(
      <PushTaskRow task={task} now={0} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />
    );
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
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
    fireEvent.click(screen.getByText('Done'));
    expect(onToggleDone).toHaveBeenCalledWith('t1');
  });

  it('gọi onDelete khi bấm nút Xóa', () => {
    const onDelete = vi.fn();
    const task = makeTask();
    render(<PushTaskRow task={task} now={0} onToggleDone={vi.fn()} onDelete={onDelete} onEditOffsets={vi.fn()} />);
    fireEvent.click(screen.getByText('Xóa'));
    expect(onDelete).toHaveBeenCalledWith('t1');
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
