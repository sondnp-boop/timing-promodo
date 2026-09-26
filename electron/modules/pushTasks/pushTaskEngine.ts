import { PushTask } from '../../store/schema';

const HOUR_MS = 3_600_000;

/**
 * Thời điểm (epoch ms) của mốc nhắc push gần nhất chưa được push trong chu kỳ hiện tại.
 * Trả về null nếu đã push hết các mốc của chu kỳ hiện tại (chờ sang chu kỳ mới).
 */
export function nextPushTime(task: PushTask): number | null {
  const pending = task.offsetsHours
    .map((offset, index) => ({ offset, index }))
    .filter(({ index }) => !task.pushedOffsetIndexes.includes(index));
  if (pending.length === 0) {
    return null;
  }
  const soonest = pending.reduce((a, b) => (a.offset < b.offset ? a : b));
  return task.cycleStart + soonest.offset * HOUR_MS;
}

/**
 * Kiểm tra và xử lý các đầu việc đã tới hạn push tại thời điểm `now`.
 * Trả về danh sách task đã cập nhật (đánh dấu offset đã push; hết mốc cuối thì dừng, không tự lặp lại)
 * cùng danh sách id các task vừa được push (để bắn notification).
 */
export function processDueTasks(tasks: PushTask[], now: number): { tasks: PushTask[]; pushedTaskIds: string[] } {
  const pushedTaskIds: string[] = [];
  const updated = tasks.map((task) => {
    if (task.done) {
      return task;
    }
    let current = task;
    let due = nextPushTime(current);
    while (due !== null && due <= now) {
      const offsetIndex = current.offsetsHours.findIndex(
        (offset, index) => current.cycleStart + offset * HOUR_MS === due && !current.pushedOffsetIndexes.includes(index)
      );
      current = {
        ...current,
        pushedOffsetIndexes: [...current.pushedOffsetIndexes, offsetIndex],
      };
      pushedTaskIds.push(current.id);
      due = nextPushTime(current);
    }
    return current;
  });
  return { tasks: updated, pushedTaskIds };
}

/** Đặt lại giờ khởi tạo của toàn bộ task (kể cả đã done) về `now`, xóa các mốc đã push. */
export function resetTasksStart(tasks: PushTask[], now: number): PushTask[] {
  return tasks.map((task) => ({ ...task, cycleStart: now, pushedOffsetIndexes: [] }));
}

/** Task đang làm sắp xếp theo mốc push gần nhất; task đã done luôn nằm dưới cùng. */
export function sortByNextPush(tasks: PushTask[]): PushTask[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    const aTime = nextPushTime(a) ?? Infinity;
    const bTime = nextPushTime(b) ?? Infinity;
    return aTime - bTime;
  });
}
