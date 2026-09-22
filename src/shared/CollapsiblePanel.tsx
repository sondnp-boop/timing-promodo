import { useState, ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  defaultExpanded: boolean;
  children: ReactNode;
}

export function CollapsiblePanel({ title, defaultExpanded, children }: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="collapsible-panel">
      <header
        className="collapsible-panel__header"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded((v) => !v);
          }
        }}
      >
        <span>{title}</span>
        <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
      </header>
      {expanded && <div className="collapsible-panel__body">{children}</div>}
    </section>
  );
}
