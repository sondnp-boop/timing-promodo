/** < 1 tiếng: "N phút"; >= 1 tiếng: "X tiếng" (tối đa 1 chữ số thập phân, vd 2 tiếng, 2.5 tiếng). */
export function formatDurationHours(hours: number): string {
  const h = Math.max(0, hours);
  const minutes = Math.round(h * 60);
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  return `${Math.round(h * 10) / 10} tiếng`;
}
