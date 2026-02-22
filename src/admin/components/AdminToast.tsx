import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, X } from 'lucide-react';

// ── Toast Types ──

export type ToastVariant = 'success' | 'error';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

// ── Toast Store (external store for useSyncExternalStore) ──

let toasts: Toast[] = [];
let listeners: Array<() => void> = [];
let nextId = 0;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): Toast[] {
  return toasts;
}

function addToast(variant: ToastVariant, message: string, duration = 4000): string {
  const id = String(++nextId);
  toasts = [...toasts, { id, variant, message, duration }];
  emitChange();
  return id;
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

// ── Public API ──

export const toast = {
  success: (message: string, duration?: number) => addToast('success', message, duration),
  error: (message: string, duration?: number) => addToast('error', message, duration),
};

export function useToast() {
  return toast;
}

// ── Single Toast Item ──

function ToastItem({ item, onDismiss }: { item: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, item.duration || 4000);

    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  const Icon = item.variant === 'success' ? CheckCircle : XCircle;
  const iconColor = item.variant === 'success' ? 'text-emerald-500' : 'text-red-500';
  const borderColor = item.variant === 'success' ? 'border-l-emerald-500' : 'border-l-red-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`flex items-start gap-3 bg-white rounded-lg px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 border-l-4 ${borderColor} min-w-[300px] max-w-md`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <p className="text-sm text-slate-700 font-medium flex-1">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className="p-1 text-slate-300 hover:text-slate-500 rounded transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ── Toast Container (render once in app layout) ──

export default function AdminToast() {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const handleDismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {currentToasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem item={item} onDismiss={handleDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
