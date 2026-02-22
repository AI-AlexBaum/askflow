import React from 'react';

export interface AdminEmptyStateProps {
  icon: React.ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AdminEmptyState({
  icon,
  message,
  actionLabel,
  onAction,
}: AdminEmptyStateProps) {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <p className="text-slate-500 font-normal text-center max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-modern-primary text-sm flex items-center gap-2 mt-1"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
