export const TASK_COLOR_PALETTE = [
  '#e57373',
  '#64b5f6',
  '#81c784',
  '#ffb74d',
  '#ba68c8',
  '#4db6ac',
  '#f06292',
  '#a1887f',
];

export function colorForIndex(index: number): string {
  const i = ((index % TASK_COLOR_PALETTE.length) + TASK_COLOR_PALETTE.length) % TASK_COLOR_PALETTE.length;
  return TASK_COLOR_PALETTE[i];
}
