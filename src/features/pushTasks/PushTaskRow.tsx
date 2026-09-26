import { PushTask } from '../../shared/types';
import { colorForIndex } from '../../shared/colorPalette';
import { CheckIcon, EditIcon, TrashIcon } from '../../shared/icons';
import { rowAlert } from '../../shared/flash';
import { formatDurationHours } from '../../shared/formatDuration';

interface PushTaskRowProps {
  task: PushTask;
  now: number;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEditOffsets: (id: string) => void;
}

const HOUR_MS = 3_600_000;

export function PushTaskRow({ task, now, onToggleDone, onDelete, onEditOffsets }: PushTaskRowProps) {
  const alert = rowAlert(task, now);
  const color = colorForIndex(task.colorIndex);

  const points = [0, ...[...task.offsetsHours].sort((a, b) => a - b)];
  const totalHours = points[points.length - 1];
  const percentOf = (hours: number) => (totalHours > 0 ? (hours / totalHours) * 100 : 0);
  const elapsedHours = (now - task.cycleStart) / HOUR_MS;
  const dotPercent = Math.min(100, Math.max(0, percentOf(elapsedHours)));

  return (
    <div
      className={alert ? `push-task-row push-task-row--flash-${alert}` : 'push-task-row'}
      data-testid={`push-task-row-${task.id}`}
    >
      <div className="push-task-row__top">
        <div className="push-task-row__info">
          <strong className={task.done ? 'is-done' : undefined}>{task.name}</strong>
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
      <div className="push-task-row__timeline">
        <div className="push-task-row__progress" data-testid={`progress-${task.id}`}>
          <div
            className="push-task-row__progress-bar"
            style={{ width: `${dotPercent}%`, backgroundColor: color }}
          />
          {points.map((hours) => (
            <span
              key={`tick-${hours}`}
              className="push-task-row__tick"
              data-testid={`tick-${task.id}`}
              style={{ left: `${percentOf(hours)}%` }}
            />
          ))}
          <span
            className="push-task-row__dot"
            data-testid={`dot-${task.id}`}
            title={`Đã trôi qua ${formatDurationHours(elapsedHours)}`}
            style={{ left: `${dotPercent}%` }}
          />
        </div>
        <div className="push-task-row__labels">
          {points.map((hours) => (
            <span key={`label-${hours}`} className="push-task-row__label" style={{ left: `${percentOf(hours)}%` }}>
              {hours === 0 ? '0' : formatDurationHours(hours)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
