// components/common/LoadingState.tsx — Crisp technical loader / skeleton.

import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<Props> = ({
  message = 'Loading data...',
  rows,
}) => {
  if (rows && rows > 0) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-8 bg-soc-border-subtle animate-pulse rounded"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-center">
      <Loader2 className="w-5 h-5 text-soc-primary animate-spin" />
      <span className="text-xs font-mono text-soc-text-secondary">{message}</span>
    </div>
  );
};
