import { PushTask } from '../../shared/types';
import { colorForIndex } from '../../shared/colorPalette';
import { CheckIcon, EditIcon, TrashIcon } from '../../shared/icons';
import { formatRemainingLabel } from '../../shared/formatRemaining';
import { flashPhase } from '../../shared/flash';
import { nextPushTime } from '../../../electron/modules/pushTasks/pushTaskEngine';

interface PushTaskRowProps {
  task: PushTask;
  now: number;
  flashStartedAt?: number;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEditOffsets: (id: string) => void;
}

const HOUR_MS = 3_600_000;

export function PushTaskRow({ task, now, flashStartedAt, onToggleDone, onDelete, onEditOffsets }: PushTaskRowProps) {
  const flash = flashPhase(flashStartedAt, now);
  const due = nextPushTime(task);
  const cycleMs = task.cycleHours * HOUR_MS;
  const elapsedInCycle = now - task.cycleStart;
  const progressPercent = due === null ? 100 : Math.min(100, Math.max(0, (elapsedInCycle / cycleMs) * 100));
  const color = colorForIndex(task.colorIndex);
  const remainingLabel = due === null ? 'Đã hoàn tất chu kỳ' : formatRemainingLabel(due - now);

  return (
    <div
      className={flash ? `push-task-row push-task-row--flash-${flash}` : 'push-task-row'}
      data-testid={`push-task-row-${task.id}`}
    >
      <div className="push-task-row__top">
        <div className="push-task-row__info">
          <strong className={task.done ? 'is-done' : undefined}>{task.name}</strong>
          <span>{remainingLabel}</span>
        </div>
        <div className="push-task-row__actions">
          <button
            type="button"
            className="icon-btn icon-btn--done"
            aria-label={task.done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
            onClick={() => onToggleDone(task.id)}
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--edit"
            aria-label="Sửa giờ push"
            onClick={() => onEditOffsets(task.id)}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--delete"
            aria-label="Xóa đầu việc"
            onClick={() => onDelete(task.id)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className="push-task-row__progress" data-testid={`progress-${task.id}`}>
        <div
          className="push-task-row__progress-bar"
          style={{ width: `${progressPercent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
