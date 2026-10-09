// components/common/EmptyState.tsx — Professional empty state.

import React from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center border border-dashed border-soc-border rounded bg-soc-card/40">
      <div className="text-soc-text-muted mb-3 opacity-60">
        {icon || <Inbox className="w-8 h-8 stroke-1" />}
      </div>
      <h3 className="text-sm font-semibold text-soc-text mb-1">{title}</h3>
      <p className="text-xs text-soc-text-secondary max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs font-medium px-3 py-1.5 rounded bg-soc-primary hover:bg-soc-primary-hover text-white transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
