import { PushTask } from '../../shared/types';
import { colorForIndex } from '../../shared/colorPalette';
import { nextPushTime } from '../../../electron/modules/pushTasks/pushTaskEngine';

interface PushTaskRowProps {
  task: PushTask;
  now: number;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEditOffsets: (id: string) => void;
}

const HOUR_MS = 3_600_000;

export function PushTaskRow({ task, now, onToggleDone, onDelete, onEditOffsets }: PushTaskRowProps) {
  const due = nextPushTime(task);
  const cycleMs = task.cycleHours * HOUR_MS;
  const elapsedInCycle = now - task.cycleStart;
  const progressPercent = due === null ? 100 : Math.min(100, Math.max(0, (elapsedInCycle / cycleMs) * 100));
  const color = colorForIndex(task.colorIndex);
  const remainingLabel =
    due === null ? 'Đã hoàn tất chu kỳ' : `Còn ${Math.max(0, Math.round((due - now) / 60000))} phút`;

  return (
    <div className="push-task-row" data-testid={`push-task-row-${task.id}`}>
      <div className="push-task-row__info">
        <strong>{task.name}</strong>
        <span>{task.pusher}</span>
        <span>{remainingLabel}</span>
      </div>
      <div className="push-task-row__progress" data-testid={`progress-${task.id}`}>
        <div
          className="push-task-row__progress-bar"
          style={{ width: `${progressPercent}%`, backgroundColor: color }}
        />
      </div>
      <div className="push-task-row__actions">
        <button type="button" onClick={() => onToggleDone(task.id)}>
          {task.done ? 'Bỏ done' : 'Done'}
        </button>
        <button type="button" onClick={() => onEditOffsets(task.id)}>
          Sửa giờ
        </button>
        <button type="button" onClick={() => onDelete(task.id)}>
          Xóa
        </button>
      </div>
    </div>
  );
}
