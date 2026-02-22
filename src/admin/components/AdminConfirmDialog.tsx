import React from 'react';
import { AlertTriangle } from 'lucide-react';
import AdminModal from './AdminModal';

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
}: AdminConfirmDialogProps) {
  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            destructive ? 'bg-red-50' : 'bg-amber-50'
          }`}
        >
          <AlertTriangle
            className={`w-6 h-6 ${
              destructive ? 'text-red-500' : 'text-amber-500'
            }`}
          />
        </div>
        <p className="text-slate-600 font-normal text-sm leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="btn-modern-secondary !px-5 !py-2.5 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 ${
            destructive
              ? 'bg-red-500 hover:bg-red-600 shadow-sm hover:shadow-md'
              : 'btn-modern-primary !px-5 !py-2.5 text-sm'
          }`}
          style={
            !destructive
              ? undefined
              : undefined
          }
        >
          {confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}
