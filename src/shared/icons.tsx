const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function CheckIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5l3 3 6-7" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg {...base}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...base}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
