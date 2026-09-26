import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PushTaskList } from '../../src/features/pushTasks/PushTaskList';
import { PushTask } from '../../src/shared/types';

function makeTask(id: string, offsetHour: number): PushTask {
  return {
    id,
    name: `Task ${id}`,
    cycleHours: 24,
    offsetsHours: [offsetHour],
    cycleStart: 0,
    pushedOffsetIndexes: [],
    done: false,
    colorIndex: Number(id),
  };
}

const noop = vi.fn();

describe('PushTaskList', () => {
  it('hiện hết task và không có nút mở rộng khi <= 5 task', () => {
    const tasks = [1, 2, 3, 4, 5].map((i) => makeTask(String(i), i));
    render(<PushTaskList tasks={tasks} now={0} onToggleDone={noop} onDelete={noop} onEditOffsets={noop} />);
    tasks.forEach((t) => expect(screen.getByTestId(`push-task-row-${t.id}`)).toBeInTheDocument());
    expect(screen.queryByText(/Xem thêm/)).not.toBeInTheDocument();
  });

  it('chỉ hiện 5 task gần hạn nhất và nút "Xem thêm N task" khi > 5 task', () => {
    const tasks = [1, 2, 3, 4, 5, 6, 7].map((i) => makeTask(String(i), i));
    render(<PushTaskList tasks={tasks} now={0} onToggleDone={noop} onDelete={noop} onEditOffsets={noop} />);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`push-task-row-${i}`)).toBeInTheDocument();
    }
    for (let i = 6; i <= 7; i++) {
      expect(screen.queryByTestId(`push-task-row-${i}`)).not.toBeInTheDocument();
    }
    expect(screen.getByText('Xem thêm 2 task')).toBeInTheDocument();
  });

  it('dòng đang nhấp nháy vẫn hiện dù nằm ngoài top 5; hết nhấp nháy thì bị ẩn lại', () => {
    const tasks = [1, 2, 3, 4, 5, 6, 7].map((i) => makeTask(String(i), i));
    const props = { tasks, onToggleDone: noop, onDelete: noop, onEditOffsets: noop };
    const flashStarts = { '7': 1000 };
    const { rerender } = render(<PushTaskList {...props} now={2000} flashStarts={flashStarts} />);
    expect(screen.getByTestId('push-task-row-7')).toHaveClass('push-task-row--flash-white');
    expect(screen.queryByTestId('push-task-row-6')).not.toBeInTheDocument();
    expect(screen.getByText('Xem thêm 1 task')).toBeInTheDocument();

    rerender(<PushTaskList {...props} now={11_000} flashStarts={flashStarts} />);
    expect(screen.queryByTestId('push-task-row-7')).not.toBeInTheDocument();
    expect(screen.getByText('Xem thêm 2 task')).toBeInTheDocument();
  });

  it('click "Xem thêm" hiện toàn bộ danh sách', () => {
    const tasks = [1, 2, 3, 4, 5, 6, 7].map((i) => makeTask(String(i), i));
    render(<PushTaskList tasks={tasks} now={0} onToggleDone={noop} onDelete={noop} onEditOffsets={noop} />);

    fireEvent.click(screen.getByText('Xem thêm 2 task'));

    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`push-task-row-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Xem thêm/)).not.toBeInTheDocument();
  });
});
