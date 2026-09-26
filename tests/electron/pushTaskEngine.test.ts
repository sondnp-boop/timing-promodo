import { describe, expect, it } from 'vitest';
import { nextPushTime, processDueTasks, sortByNextPush } from '../../electron/modules/pushTasks/pushTaskEngine';
import { PushTask } from '../../electron/store/schema';

const HOUR = 3_600_000;

function makeTask(overrides: Partial<PushTask> = {}): PushTask {
  return {
    id: 'task-1',
    name: 'Task A',
    offsetsHours: [3, 6, 9],
    cycleStart: 0,
    pushedOffsetIndexes: [],
    done: false,
    colorIndex: 0,
    ...overrides,
  };
}

describe('pushTaskEngine', () => {
  describe('nextPushTime', () => {
    it('trả về mốc offset nhỏ nhất chưa push', () => {
      const task = makeTask({ cycleStart: 1000 });
      expect(nextPushTime(task)).toBe(1000 + 3 * HOUR);
    });

    it('bỏ qua các offset đã push', () => {
      const task = makeTask({ cycleStart: 0, pushedOffsetIndexes: [0] });
      expect(nextPushTime(task)).toBe(6 * HOUR);
    });

    it('trả về null khi đã push hết offsets trong chu kỳ', () => {
      const task = makeTask({ pushedOffsetIndexes: [0, 1, 2] });
      expect(nextPushTime(task)).toBeNull();
    });
  });

  describe('processDueTasks', () => {
    it('đánh dấu offset đã tới hạn và trả về id task được push', () => {
      const task = makeTask({ cycleStart: 0 });
      const { tasks, pushedTaskIds } = processDueTasks([task], 3 * HOUR);
      expect(pushedTaskIds).toEqual(['task-1']);
      expect(tasks[0].pushedOffsetIndexes).toEqual([0]);
    });

    it('không đụng tới task chưa tới hạn', () => {
      const task = makeTask({ cycleStart: 0 });
      const { tasks, pushedTaskIds } = processDueTasks([task], 1 * HOUR);
      expect(pushedTaskIds).toEqual([]);
      expect(tasks[0].pushedOffsetIndexes).toEqual([]);
    });

    it('hết mốc cuối thì dừng: đánh dấu đã push hết, không tự sang chu kỳ mới', () => {
      const task = makeTask({ cycleStart: 0, offsetsHours: [1] });
      const { tasks } = processDueTasks([task], 1 * HOUR);
      expect(tasks[0].cycleStart).toBe(0);
      expect(tasks[0].pushedOffsetIndexes).toEqual([0]);
      expect(nextPushTime(tasks[0])).toBeNull();
      const again = processDueTasks(tasks, 100 * HOUR);
      expect(again.pushedTaskIds).toEqual([]);
    });

    it('bỏ qua task đã done', () => {
      const task = makeTask({ cycleStart: 0, done: true });
      const { tasks, pushedTaskIds } = processDueTasks([task], 100 * HOUR);
      expect(pushedTaskIds).toEqual([]);
      expect(tasks[0]).toEqual(task);
    });

    it('xử lý nhiều offset quá hạn cùng lúc (app bị đóng lâu)', () => {
      const task = makeTask({ cycleStart: 0, offsetsHours: [1, 2, 3] });
      const { tasks, pushedTaskIds } = processDueTasks([task], 5 * HOUR);
      expect(pushedTaskIds).toEqual(['task-1', 'task-1', 'task-1']);
      expect(tasks[0].cycleStart).toBe(0);
      expect(tasks[0].pushedOffsetIndexes).toEqual([0, 1, 2]);
    });
  });

  describe('sortByNextPush', () => {
    it('sắp xếp task gần hạn nhất lên đầu', () => {
      const taskFar = makeTask({ id: 'far', cycleStart: 0, offsetsHours: [10] });
      const taskNear = makeTask({ id: 'near', cycleStart: 0, offsetsHours: [1] });
      const sorted = sortByNextPush([taskFar, taskNear]);
      expect(sorted.map((t) => t.id)).toEqual(['near', 'far']);
    });

    it('task đã done luôn nằm dưới cùng dù mốc push gần hơn', () => {
      const doneSoon = makeTask({ id: 'done-soon', cycleStart: 0, offsetsHours: [1], done: true });
      const pendingFar = makeTask({ id: 'far', cycleStart: 0, offsetsHours: [10] });
      const pendingNear = makeTask({ id: 'near', cycleStart: 0, offsetsHours: [2] });
      expect(sortByNextPush([doneSoon, pendingFar, pendingNear]).map((t) => t.id)).toEqual([
        'near',
        'far',
        'done-soon',
      ]);
    });

    it('task hết mốc nhưng chưa done nằm trên task đã done; các task done sắp theo mốc', () => {
      const expiredNotDone = makeTask({ id: 'expired', pushedOffsetIndexes: [0, 1, 2] });
      const done1 = makeTask({ id: 'd1', cycleStart: 0, offsetsHours: [5], done: true });
      const done2 = makeTask({ id: 'd2', cycleStart: 0, offsetsHours: [1], done: true });
      expect(sortByNextPush([done1, expiredNotDone, done2]).map((t) => t.id)).toEqual(['expired', 'd2', 'd1']);
    });

    it('bỏ done thì task quay lại đúng vị trí theo mốc', () => {
      const a = makeTask({ id: 'a', cycleStart: 0, offsetsHours: [1], done: true });
      const b = makeTask({ id: 'b', cycleStart: 0, offsetsHours: [2] });
      expect(sortByNextPush([a, b]).map((t) => t.id)).toEqual(['b', 'a']);
      expect(sortByNextPush([{ ...a, done: false }, b]).map((t) => t.id)).toEqual(['a', 'b']);
    });

    it('task đã hết chu kỳ (nextPushTime null) xếp cuối', () => {
      const taskDone = makeTask({ id: 'done', pushedOffsetIndexes: [0, 1, 2] });
      const taskPending = makeTask({ id: 'pending', cycleStart: 0, offsetsHours: [5] });
      const sorted = sortByNextPush([taskDone, taskPending]);
      expect(sorted.map((t) => t.id)).toEqual(['pending', 'done']);
    });
  });
});
