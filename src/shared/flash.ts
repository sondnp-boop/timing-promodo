import { PushTask } from './types';

export const WARN_BEFORE_MS = 15_000;
const HOUR_MS = 3_600_000;

export type RowAlert = 'yellow' | 'white' | 'red' | 'green';

/**
 * Trạng thái nhấp nháy của một dòng tại thời điểm `now`:
 * - 15 giây trước mỗi mốc push: vàng/trắng (đổi mỗi 1 giây), hết 15 giây thì về mặc định;
 * - từ mốc cuối cùng trở đi: đỏ/xanh liên tục cho tới khi task được đánh done.
 */
export function rowAlert(task: PushTask, now: number): RowAlert | null {
  if (task.done || task.offsetsHours.length === 0) {
    return null;
  }
  const endAt = task.cycleStart + Math.max(...task.offsetsHours) * HOUR_MS;
  if (now >= endAt) {
    return Math.floor((now - endAt) / 1000) % 2 === 0 ? 'red' : 'green';
  }
  for (const offset of task.offsetsHours) {
    const at = task.cycleStart + offset * HOUR_MS;
    const start = at - WARN_BEFORE_MS;
    if (now >= start && now < at) {
      return Math.floor((now - start) / 1000) % 2 === 0 ? 'yellow' : 'white';
    }
  }
  return null;
}
