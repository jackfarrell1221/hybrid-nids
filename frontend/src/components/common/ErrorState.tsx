// components/common/ErrorState.tsx — Meaningful error display with retry.

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<Props> = ({
  title = 'Service Unavailable',
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="p-6 border border-red-300 dark:border-red-900/60 rounded bg-red-500/5 dark:bg-red-950/20 text-center flex flex-col items-center justify-center">
      <AlertCircle className="w-8 h-8 text-red-500 mb-2 stroke-1" />
      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">{title}</h4>
      <p className="text-xs text-soc-text-secondary max-w-md mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-soc-border hover:bg-soc-card-hover text-soc-text transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Reconnecting…' : 'Retry Request'}</span>
        </button>
      )}
    </div>
  );
};
