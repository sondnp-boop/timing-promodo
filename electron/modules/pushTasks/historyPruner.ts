import { PushHistoryEntry } from '../../store/schema';

export const MAX_HISTORY_DAYS = 10;
const DAY_MS = 86_400_000;

export function pruneHistory(history: PushHistoryEntry[], now: number, maxDays = MAX_HISTORY_DAYS): PushHistoryEntry[] {
  const cutoff = now - maxDays * DAY_MS;
  return history.filter((entry) => entry.pushedAt >= cutoff);
}
