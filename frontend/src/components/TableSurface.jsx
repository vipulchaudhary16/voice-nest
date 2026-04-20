/**
 * Shared table layout + sticky header. Import from here so Contacts, Calls, and any
 * custom table stay visually aligned when these tokens change.
 */

/**
 * Table card shell — no overflow here so `position: sticky` on `<thead>` / `<th>` can
 * use the nearest ancestor scrollport (e.g. Contacts list `overflow-auto`). Wide tables
 * then scroll horizontally on that same ancestor.
 */
export const tableScrollShellClass =
  'bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm';

/** Card without inner scroll (loading / empty states) */
export const tableShellClass =
  'bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden';

export const tableElementClass =
  'w-full border-separate border-spacing-0 text-left text-sm whitespace-nowrap';

/** Sticky <thead>; sticks under the nearest scrolling ancestor (e.g. page content). */
export const theadStickyClass =
  'sticky top-0 z-20 bg-[var(--bg-input)] border-b border-[var(--border)] shadow-sm';

/**
 * Sticky thead below another sticky bar (e.g. Calls accordion day row ~48px + padding).
 */
export const theadStickyBelowBarClass =
  'sticky top-12 z-20 bg-[var(--bg-input)] border-b border-[var(--border)] shadow-sm';

export const headerRowClass = 'text-[var(--text-secondary)] text-xs uppercase tracking-wider';

/** Solid bg on cells so sticky header paints over scrolling body rows. */
export const thBaseClass = 'bg-[var(--bg-input)] px-3 py-2 font-semibold';

export const tbodyClass = 'divide-y divide-[var(--border)]';

export const trBodyClass = 'leading-snug hover:bg-[var(--bg-input)] transition-colors group';

export const tdBaseClass = 'px-3 py-2';

/**
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function TableScrollShell({ children, className = '' }) {
  return <div className={`${tableScrollShellClass} ${className}`.trim()}>{children}</div>;
}

/**
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function TableShell({ children, className = '' }) {
  return <div className={`${tableShellClass} ${className}`.trim()}>{children}</div>;
}
