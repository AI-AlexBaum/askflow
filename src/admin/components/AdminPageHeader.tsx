import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

export default function AdminPageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--color-brand-primary, #2563eb)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-slate-500 font-normal mt-1">{subtitle}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-modern-primary flex items-center gap-2"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
