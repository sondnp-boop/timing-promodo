export const FLASH_DURATION_MS = 10_000;

export type FlashPhase = 'yellow' | 'white';

/** Màu nhấp nháy tại thời điểm `now` (đổi mỗi 1 giây, tối đa 10 giây); null nếu không nhấp nháy. */
export function flashPhase(startedAt: number | undefined, now: number): FlashPhase | null {
  if (startedAt === undefined) {
    return null;
  }
  const elapsed = now - startedAt;
  if (elapsed < 0 || elapsed >= FLASH_DURATION_MS) {
    return null;
  }
  return Math.floor(elapsed / 1000) % 2 === 0 ? 'yellow' : 'white';
}
