// components/SeverityBadge.tsx — Visual severity indicator.

import React from 'react';
import type { Severity } from '../types';

const map: Record<Severity, string> = {
  LOW:      'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
  MEDIUM:   'bg-yellow-900/40 text-yellow-400 border border-yellow-700/40',
  HIGH:     'bg-orange-900/40 text-orange-400 border border-orange-700/40',
  CRITICAL: 'bg-red-900/40 text-red-400 border border-red-700/40',
  UNKNOWN:  'bg-gray-800 text-gray-400 border border-gray-700',
};

interface Props {
  severity: Severity;
}

const SeverityBadge: React.FC<Props> = ({ severity }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-semibold mono ${map[severity]}`}>
    {severity}
  </span>
);

export default SeverityBadge;
