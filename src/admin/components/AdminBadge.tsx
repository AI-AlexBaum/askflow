import React from 'react';

export type AdminBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface AdminBadgeProps {
  variant?: AdminBadgeVariant;
  children: React.ReactNode;
}

const variantClasses: Record<AdminBadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  error: 'bg-red-50 text-red-700 ring-red-200/60',
  info: 'bg-sky-50 text-sky-700 ring-sky-200/60',
  neutral: 'bg-slate-50 text-slate-600 ring-slate-200/60',
};

export default function AdminBadge({
  variant = 'neutral',
  children,
}: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
