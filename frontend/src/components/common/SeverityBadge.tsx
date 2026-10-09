// components/common/SeverityBadge.tsx — SOC-style severity indicator.

import React from 'react';
import type { Severity } from '../../types';

interface Props {
  severity: Severity;
  size?: 'sm' | 'md';
}

const severityConfig: Record<Severity, { dot: string; bg: string; text: string; border: string }> = {
  CRITICAL: {
    dot: 'bg-red-500',
    bg: 'bg-red-500/10 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-900/60',
  },
  HIGH: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-500/10 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-300 dark:border-orange-900/60',
  },
  MEDIUM: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-900/60',
  },
  LOW: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-900/60',
  },
  UNKNOWN: {
    dot: 'bg-gray-400',
    bg: 'bg-gray-500/10 dark:bg-gray-900/40',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-800',
  },
};

export const SeverityBadge: React.FC<Props> = ({ severity, size = 'sm' }) => {
  const conf = severityConfig[severity] || severityConfig.UNKNOWN;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded mono ${conf.bg} ${conf.text} ${conf.border} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      <span>{severity}</span>
    </span>
  );
};
