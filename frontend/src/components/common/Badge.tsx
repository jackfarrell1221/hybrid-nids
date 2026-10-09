// components/common/Badge.tsx — Technical tag/badge.

import React from 'react';

interface Props {
  children: React.ReactNode;
  variant?: 'neutral' | 'blue' | 'success' | 'warning' | 'critical' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<Props> = ({
  children,
  variant = 'neutral',
  size = 'sm',
}) => {
  const styles = {
    neutral: 'bg-soc-border-subtle text-soc-text-secondary border-soc-border',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-900/50',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/50',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900/50',
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-900/50',
    outline: 'bg-transparent text-soc-text-secondary border-soc-border',
  }[variant];

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium border rounded ${styles} ${padding}`}
    >
      {children}
    </span>
  );
};
