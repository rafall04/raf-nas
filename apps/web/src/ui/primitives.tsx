import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Role, ROLE_LABEL_ID } from '@rafnas/shared';
import { categoryOf, type Category } from '../data/types';
import { Icon } from './icons';
import './ui.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', children, ...rest }: BtnProps): JSX.Element {
  return (
    <button className={`btn btn-${variant} btn-${size}`} {...rest}>
      {children}
    </button>
  );
}

export function Badge({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}): JSX.Element {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const ROLE_TONE: Record<Role, string> = {
  [Role.NONE]: 'none',
  [Role.VIEWER]: 'viewer',
  [Role.CONTRIBUTOR]: 'contributor',
  [Role.EDITOR]: 'editor',
  [Role.MANAGER]: 'manager',
};

export function RoleBadge({ role }: { role: Role }): JSX.Element {
  return <span className={`role-badge role-${ROLE_TONE[role]}`}>{ROLE_LABEL_ID[role]}</span>;
}

export function FileTypeChip({ ext, isFolder }: { ext?: string; isFolder?: boolean }): JSX.Element {
  if (isFolder) {
    return (
      <span className="ft-folder" aria-hidden="true">
        <Icon name="folder" size={18} />
      </span>
    );
  }
  const cat: Category = categoryOf(ext);
  const label = (ext ?? '?').slice(0, 3).toUpperCase();
  return (
    <span className={`ft-chip ft-${cat}`} title={ext ? `.${ext}` : 'tak dikenal'}>
      <span className="ft-label">{label}</span>
    </span>
  );
}

export function QuotaBar({ used, total }: { used: number; total: number }): JSX.Element {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const tone = pct >= 95 ? 'danger' : pct >= 80 ? 'warning' : 'primary';
  return (
    <div className="quota">
      <div className="quota-track">
        <div className={`quota-fill quota-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
      {action}
    </div>
  );
}
