import { useState } from 'react';
import { PushTask } from '../../shared/types';
import { PushTaskRow } from './PushTaskRow';

interface PushTaskListProps {
  tasks: PushTask[];
  now: number;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEditOffsets: (id: string) => void;
}

const VISIBLE_LIMIT = 5;

export function PushTaskList({ tasks, now, onToggleDone, onDelete, onEditOffsets }: PushTaskListProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMore = tasks.length > VISIBLE_LIMIT;
  const visibleTasks = expanded || !hasMore ? tasks : tasks.slice(0, VISIBLE_LIMIT);
  const hiddenCount = tasks.length - VISIBLE_LIMIT;

  return (
    <div className="push-task-list">
      {visibleTasks.map((task) => (
        <PushTaskRow
          key={task.id}
          task={task}
          now={now}
          onToggleDone={onToggleDone}
          onDelete={onDelete}
          onEditOffsets={onEditOffsets}
        />
      ))}
      {hasMore && !expanded && (
        <button type="button" className="push-task-list__more" onClick={() => setExpanded(true)}>
          Xem thêm {hiddenCount} task
        </button>
      )}
    </div>
  );
}
