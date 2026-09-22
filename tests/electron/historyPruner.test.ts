import { describe, expect, it } from 'vitest';
import { pruneHistory, MAX_HISTORY_DAYS } from '../../electron/modules/pushTasks/historyPruner';
import { PushHistoryEntry } from '../../electron/store/schema';

const DAY = 86_400_000;

describe('historyPruner', () => {
  it('giữ lại entry còn trong 10 ngày', () => {
    const now = 100 * DAY;
    const history: PushHistoryEntry[] = [{ taskId: 't1', pushedAt: now - 5 * DAY }];
    expect(pruneHistory(history, now)).toEqual(history);
  });

  it('loại bỏ entry cũ hơn 10 ngày', () => {
    const now = 100 * DAY;
    const history: PushHistoryEntry[] = [{ taskId: 't1', pushedAt: now - 11 * DAY }];
    expect(pruneHistory(history, now)).toEqual([]);
  });

  it('entry đúng ranh giới MAX_HISTORY_DAYS được giữ lại', () => {
    const now = 100 * DAY;
    const history: PushHistoryEntry[] = [{ taskId: 't1', pushedAt: now - MAX_HISTORY_DAYS * DAY }];
    expect(pruneHistory(history, now)).toEqual(history);
  });

  it('lọc đúng hỗn hợp entry mới và cũ', () => {
    const now = 100 * DAY;
    const history: PushHistoryEntry[] = [
      { taskId: 'old', pushedAt: now - 20 * DAY },
      { taskId: 'new', pushedAt: now - 1 * DAY },
    ];
    expect(pruneHistory(history, now)).toEqual([{ taskId: 'new', pushedAt: now - 1 * DAY }]);
  });
});
