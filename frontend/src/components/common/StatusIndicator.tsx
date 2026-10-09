// components/common/StatusIndicator.tsx — System state indicator.

import React from 'react';

interface Props {
  status: 'operational' | 'degraded' | 'critical' | 'neutral' | 'active';
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusIndicator: React.FC<Props> = ({
  status,
  label,
  size = 'md',
  pulse = false,
}) => {
  const dotColor = {
    operational: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400',
    active: 'bg-blue-500 text-blue-600 dark:text-blue-400',
    degraded: 'bg-amber-500 text-amber-600 dark:text-amber-400',
    critical: 'bg-red-500 text-red-600 dark:text-red-400',
    neutral: 'bg-gray-400 text-gray-500 dark:text-gray-400',
  }[status];

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="relative flex items-center justify-center">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${dotColor.split(' ')[0]}`}
          />
        )}
        <span className={`inline-block rounded-full ${dotSize} ${dotColor.split(' ')[0]}`} />
      </span>
      {label && (
        <span className="text-xs font-medium text-soc-text-secondary tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};
