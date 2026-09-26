import { useState } from 'react';
import { PushTask } from '../../shared/types';
import { flashPhase } from '../../shared/flash';
import { PushTaskRow } from './PushTaskRow';

interface PushTaskListProps {
  tasks: PushTask[];
  now: number;
  flashStarts?: Record<string, number>;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEditOffsets: (id: string) => void;
}

const VISIBLE_LIMIT = 5;

export function PushTaskList({
  tasks,
  now,
  flashStarts = {},
  onToggleDone,
  onDelete,
  onEditOffsets,
}: PushTaskListProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = tasks.length > VISIBLE_LIMIT;
  // Dòng đang nhấp nháy luôn hiện, kể cả khi đã bị đẩy ra ngoài top 5.
  const visibleTasks =
    expanded || !hasMore
      ? tasks
      : tasks.filter((task, index) => index < VISIBLE_LIMIT || flashPhase(flashStarts[task.id], now) !== null);
  const hiddenCount = tasks.length - visibleTasks.length;

  return (
    <div className="push-task-list">
      {visibleTasks.map((task) => (
        <PushTaskRow
          key={task.id}
          task={task}
          now={now}
          flashStartedAt={flashStarts[task.id]}
          onToggleDone={onToggleDone}
          onDelete={onDelete}
          onEditOffsets={onEditOffsets}
        />
      ))}
      {hiddenCount > 0 && !expanded && (
        <button type="button" className="push-task-list__more" onClick={() => setExpanded(true)}>
          Xem thêm {hiddenCount} task
        </button>
      )}
    </div>
  );
}
