// components/common/ToastContainer.tsx — Renders active toasts.

import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icon = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
          info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
        }[toast.type];

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2.5 p-3 rounded border border-soc-border bg-soc-card shadow-lg text-xs transition-all duration-200"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-soc-text">{toast.title}</div>
              {toast.message && (
                <div className="text-soc-text-secondary mt-0.5 leading-relaxed break-words font-mono text-[11px]">
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-soc-text-muted hover:text-soc-text transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
