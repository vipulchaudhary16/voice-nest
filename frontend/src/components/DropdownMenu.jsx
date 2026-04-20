import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/**
 * @typedef {{ key?: string, label: string, icon?: import('lucide-react').LucideIcon, onClick?: () => void, disabled?: boolean, danger?: boolean, separator?: boolean }} DropdownMenuItem
 */

/**
 * @param {{
 *   items: DropdownMenuItem[],
 *   align?: 'left' | 'right',
 *   disabled?: boolean,
 *   variant?: 'button' | 'icon',
 *   label?: string,
 *   Icon?: import('lucide-react').LucideIcon,
 *   buttonClassName?: string,
 *   menuClassName?: string,
 *   'aria-label'?: string,
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function DropdownMenu({
  items,
  align = 'right',
  disabled = false,
  variant = 'button',
  label = 'Menu',
  Icon,
  buttonClassName = '',
  menuClassName = '',
  'aria-label': ariaLabel,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(
    /** @type {{ top: number, left?: number, right?: number } | null} */ (null),
  );
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPos = () => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 4;
    if (align === 'right') {
      setMenuPos({ top: rect.bottom + gap, right: window.innerWidth - rect.right });
    } else {
      setMenuPos({ top: rect.bottom + gap, left: rect.left });
    }
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPos();
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => updateMenuPos();
    window.addEventListener('resize', onScrollResize);
    document.addEventListener('scroll', onScrollResize, true);
    return () => {
      window.removeEventListener('resize', onScrollResize);
      document.removeEventListener('scroll', onScrollResize, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = /** @type {Node} */ (e.target);
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!disabled) setOpen((o) => !o);
  };

  const baseBtn =
    variant === 'icon'
      ? `p-2 rounded-lg border border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''} ${buttonClassName}`
      : `inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''} ${buttonClassName}`;

  const menuPanel =
    open &&
    menuPos &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-orientation="vertical"
        style={{
          position: 'fixed',
          top: menuPos.top,
          ...(align === 'right' ? { right: menuPos.right } : { left: menuPos.left }),
          minWidth: '12.5rem',
          zIndex: 9999,
        }}
        className={`rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg ring-1 ring-black/5 ${menuClassName}`}
      >
        {items.map((item, i) =>
          item.separator ? (
            <div key={`sep-${i}`} className="my-1 h-px bg-[var(--border)]" role="separator" />
          ) : (
            <button
              key={item.key ?? `${item.label}-${i}`}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
              }`}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
            >
              {item.icon && <item.icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />}
              <span className="min-w-0 flex-1">{item.label}</span>
            </button>
          ),
        )}
      </div>,
      document.body,
    );

  return (
    <div className="relative inline-block text-left">
      {variant === 'icon' ? (
        <button
          ref={btnRef}
          type="button"
          className={baseBtn}
          onClick={toggle}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={ariaLabel || 'Open row actions'}
        >
          {children}
        </button>
      ) : (
        <button
          ref={btnRef}
          type="button"
          className={baseBtn}
          onClick={toggle}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={ariaLabel || label}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />}
          <span>{label}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      )}
      {menuPanel}
    </div>
  );
}
