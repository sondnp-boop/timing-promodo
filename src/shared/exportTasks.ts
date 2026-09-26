import { PushTask } from './types';
import { formatDurationHours } from './formatDuration';

const HOUR_MS = 3_600_000;

/** Danh sách đã done trước, rồi tới đang Progress (kèm thời gian đã trôi qua / chu kỳ setup). */
export function buildExportLines(tasks: PushTask[], now: number): string[] {
  const ordered = [...tasks.filter((t) => t.done), ...tasks.filter((t) => !t.done)];
  return ordered.map((task, index) => {
    const name = task.name.replace(/\s+/g, ' ').trim();
    if (task.done) {
      return `${index + 1}. ${name}. Done`;
    }
    const elapsed = formatDurationHours((now - task.cycleStart) / HOUR_MS);
    return `${index + 1}. ${name}. Progress. ${elapsed} / ${task.offsetsHours.join(',')}`;
  });
}

export function buildExportText(tasks: PushTask[], now: number): string {
  return buildExportLines(tasks, now).join('\n');
}
