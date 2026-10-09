// components/StatusCard.tsx — Metric card for the top status strip.

import React from 'react';

interface StatusCardProps {
  label: string;
  value: string | number;
  color?: 'green' | 'red' | 'orange' | 'blue' | 'default';
  icon?: React.ReactNode;
}

const colorMap = {
  green:   'text-nids-green border-nids-green/20',
  red:     'text-nids-red border-nids-red/20',
  orange:  'text-nids-orange border-nids-orange/20',
  blue:    'text-nids-blue border-nids-blue/20',
  default: 'text-nids-text border-nids-border',
};

const StatusCard: React.FC<StatusCardProps> = ({
  label,
  value,
  color = 'default',
  icon,
}) => {
  return (
    <div className={`bg-nids-surface border rounded px-4 py-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="text-xs text-nids-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold mono">{value}</div>
    </div>
  );
};

export default StatusCard;
