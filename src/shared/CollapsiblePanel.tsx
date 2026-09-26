import { useState, ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  badge?: number;
  headerExtra?: ReactNode;
  defaultExpanded: boolean;
  children: ReactNode;
}

export function CollapsiblePanel({ title, badge, headerExtra, defaultExpanded, children }: CollapsiblePanelProps) {
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
        <span>
          <span>{title}</span>
          {badge !== undefined && (
            <span className="collapsible-panel__badge" data-testid="panel-badge">
              {badge}
            </span>
          )}
          {headerExtra && (
            <span
              className="collapsible-panel__extra"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {headerExtra}
            </span>
          )}
        </span>
        <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
      </header>
      {expanded && <div className="collapsible-panel__body">{children}</div>}
    </section>
  );
}
