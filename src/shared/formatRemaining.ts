export function formatRemainingLabel(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes >= 60) {
    return `Còn ${Math.floor(minutes / 60)} tiếng`;
  }
  return `Còn ${minutes} phút`;
}
