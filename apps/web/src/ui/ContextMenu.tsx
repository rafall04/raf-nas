import { useEffect, useRef } from 'react';
import { Icon, type IconName } from './icons';
import './contextmenu.css';

export interface MenuItem {
  label: string;
  icon?: IconName;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  onClick?: () => void;
}

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const menuW = 220;
  const menuH = items.length * 36 + 16;
  let left = x;
  let top = y;
  if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
  if (top + menuH > window.innerHeight - 8) top = Math.max(8, y - menuH);

  return (
    <div ref={ref} className="ctx-menu" style={{ left, top }} role="menu">
      {items.map((it, i) => (
        <div key={i}>
          {it.separatorBefore && <div className="ctx-sep" />}
          <button
            className={`ctx-item${it.danger ? ' danger' : ''}`}
            disabled={it.disabled}
            role="menuitem"
            onClick={() => {
              it.onClick?.();
              onClose();
            }}
          >
            {it.icon ? <Icon name={it.icon} size={16} /> : <span style={{ width: 16 }} />}
            <span>{it.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
