// components/common/Drawer.tsx — Slide-over panel for alert details and deep inspection.

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-lg',
}) => {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 transition-opacity duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${width} bg-soc-card border-l border-soc-border shadow-xl flex flex-col`}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-soc-border flex items-center justify-between bg-soc-bg/40">
            <div>
              <h2 className="text-sm font-semibold text-soc-text tracking-tight">{title}</h2>
              {subtitle && (
                <p className="text-xs text-soc-text-secondary mt-0.5 font-mono">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-soc-text-secondary hover:text-soc-text hover:bg-soc-card-hover transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
