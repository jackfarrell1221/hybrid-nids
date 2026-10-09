// components/AlertFeed.tsx — Live alert table showing intrusion history.

import React from 'react';
import type { Alert } from '../types';
import SeverityBadge from './SeverityBadge';

interface Props {
  alerts: Alert[];
  loading: boolean;
}

const fmtTs = (ts: string) => {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
};

const fmtBytes = (b: number) =>
  b >= 1_000_000
    ? `${(b / 1_000_000).toFixed(1)}M`
    : b >= 1_000
    ? `${(b / 1_000).toFixed(1)}K`
    : `${b}`;

const AlertFeed: React.FC<Props> = ({ alerts, loading }) => {
  return (
    <section className="bg-nids-surface border border-nids-border rounded p-4">
      <h2 className="text-sm font-semibold text-nids-muted uppercase tracking-wider mb-3">
        Alert Feed
        {loading && <span className="ml-2 text-nids-muted text-xs">(refreshing…)</span>}
      </h2>

      {alerts.length === 0 ? (
        <div className="text-center text-nids-muted text-xs py-6">
          No alerts yet. Analyze traffic or run a simulation.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-nids-border text-nids-muted">
                <th className="text-left py-1 pr-3">Time</th>
                <th className="text-left py-1 pr-3">Attack</th>
                <th className="text-left py-1 pr-3">Severity</th>
                <th className="text-left py-1 pr-3">Method</th>
                <th className="text-right py-1 pr-3">Src Bytes</th>
                <th className="text-right py-1 pr-3">Dst Bytes</th>
                <th className="text-right py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-nids-border/30 hover:bg-nids-bg/40 transition-colors"
                >
                  <td className="py-1 pr-3 mono text-nids-muted">{fmtTs(a.timestamp)}</td>
                  <td className="py-1 pr-3 mono text-nids-text font-semibold">
                    {a.attack_type ?? 'ML_ANOMALY'}
                  </td>
                  <td className="py-1 pr-3">
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td className="py-1 pr-3 text-nids-muted">{a.detection_method}</td>
                  <td className="py-1 pr-3 text-right mono">{fmtBytes(a.src_bytes)}</td>
                  <td className="py-1 pr-3 text-right mono">{fmtBytes(a.dst_bytes)}</td>
                  <td className="py-1 text-right">
                    <span className="text-nids-red font-semibold mono">INTRUSION</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AlertFeed;
