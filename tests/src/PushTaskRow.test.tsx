import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PushTaskRow } from '../../src/features/pushTasks/PushTaskRow';
import { PushTask } from '../../src/shared/types';
import { TASK_COLOR_PALETTE } from '../../src/shared/colorPalette';

function makeTask(overrides: Partial<PushTask> = {}): PushTask {
  return {
    id: 't1',
    name: 'Task A',
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

  const HOUR = 3_600_000;
  const renderAt = (task: PushTask, now: number) =>
    render(<PushTaskRow task={task} now={now} onToggleDone={vi.fn()} onDelete={vi.fn()} onEditOffsets={vi.fn()} />);
  const left = (el: HTMLElement) => parseFloat(el.style.left);

  it('không còn dòng nhãn "Còn ..."', () => {
    renderAt(makeTask(), 0);
    expect(screen.queryByText(/^Còn /)).not.toBeInTheDocument();
    expect(screen.queryByText('Đã hoàn tất chu kỳ')).not.toBeInTheDocument();
  });

  it('timeline chia theo các mốc đã setup: setup 1,2,3 -> 4 điểm 0,1,2,3', () => {
    renderAt(makeTask({ offsetsHours: [1, 2, 3] }), 0);
    const ticks = screen.getAllByTestId('tick-t1');
    expect(ticks).toHaveLength(4);
    expect(ticks.map((t) => Math.round(left(t)))).toEqual([0, 33, 67, 100]);
    ['0', '1 tiếng', '2 tiếng', '3 tiếng'].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
  });

  it('nhãn mốc: < 1 giờ hiển thị phút, >= 1 giờ hiển thị tiếng', () => {
    renderAt(makeTask({ offsetsHours: [1 / 6, 0.5, 2, 2.5] }), 0);
    ['0', '10 phút', '30 phút', '2 tiếng', '2.5 tiếng'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument()
    );
  });

  it('tooltip của chấm đỏ hiển thị thời gian đã trôi qua (phút nếu < 1 tiếng, tiếng nếu >= 1 tiếng)', () => {
    const task = makeTask({ offsetsHours: [1, 2, 3] });
    const cases: [number, string][] = [
      [0, 'Đã trôi qua 0 phút'],
      [0.5 * HOUR, 'Đã trôi qua 30 phút'],
      [1 * HOUR, 'Đã trôi qua 1 tiếng'],
      [2.5 * HOUR, 'Đã trôi qua 2.5 tiếng'],
    ];
    for (const [now, title] of cases) {
      const { unmount } = renderAt(task, now);
      expect(screen.getByTestId('dot-t1')).toHaveAttribute('title', title);
      unmount();
    }
  });

  it('chấm đỏ ở chính giữa đoạn 0-1 khi đã trôi 30 phút (setup 1,2,3)', () => {
    renderAt(makeTask({ offsetsHours: [1, 2, 3] }), 0.5 * HOUR);
    const dot = screen.getByTestId('dot-t1');
    const oneHourTick = screen.getAllByTestId('tick-t1')[1];
    expect(left(dot)).toBeCloseTo(left(oneHourTick) / 2, 5);
  });

  it('chấm đỏ di chuyển dần tới cuối thanh và dừng ở 100% khi quá mốc cuối', () => {
    const task = makeTask({ offsetsHours: [1, 2, 3] });
    const positions = [0, 1, 2, 3, 5].map((h) => {
      const { unmount } = renderAt(task, h * HOUR);
      const value = left(screen.getByTestId('dot-t1'));
      unmount();
      return value;
    });
    expect(positions[0]).toBe(0);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions[3]).toBe(100);
    expect(positions[4]).toBe(100);
  });

  it('thanh chia theo tỉ lệ thời gian thật khi mốc không đều (1,5)', () => {
    renderAt(makeTask({ offsetsHours: [1, 5] }), 0);
    expect(screen.getAllByTestId('tick-t1').map((t) => left(t))).toEqual([0, 20, 100]);
  });

  it('nhấp nháy vàng/trắng trong 15 giây trước mỗi mốc rồi về mặc định', () => {
    const task = makeTask({ offsetsHours: [1, 2] });
    const cases: [number, string | null][] = [
      [HOUR - 15_000, 'push-task-row--flash-yellow'],
      [HOUR - 14_000, 'push-task-row--flash-white'],
      [HOUR - 1, 'push-task-row--flash-yellow'],
      [HOUR, null],
    ];
    for (const [now, cls] of cases) {
      const { unmount } = renderAt(task, now);
      const row = screen.getByTestId('push-task-row-t1');
      if (cls) expect(row).toHaveClass(cls);
      else expect(row.className).toBe('push-task-row');
      unmount();
    }
  });

  it('hết chu kỳ setup thì nhấp nháy đỏ/xanh liên tục; done thì dừng', () => {
    const task = makeTask({ offsetsHours: [1, 2, 3] });
    const end = 3 * HOUR;
    const first = renderAt(task, end);
    expect(screen.getByTestId('push-task-row-t1')).toHaveClass('push-task-row--flash-red');
    first.unmount();
    const second = renderAt(task, end + 1000);
    expect(screen.getByTestId('push-task-row-t1')).toHaveClass('push-task-row--flash-green');
    second.unmount();
    renderAt({ ...task, done: true }, end + 1000);
    expect(screen.getByTestId('push-task-row-t1').className).toBe('push-task-row');
  });
});

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;
  const [, r, g, b] = match;
  return `#${[r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
}
