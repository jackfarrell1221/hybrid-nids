// components/alerts/AlertTable.tsx — Information-dense SOC alert log table.

import React, { useState, useMemo } from 'react';
import type { Alert } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { Badge } from '../common/Badge';
import { Search, Filter } from 'lucide-react';

interface Props {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  selectedAlertId?: number;
  compact?: boolean;
}

export const AlertTable: React.FC<Props> = ({
  alerts,
  onSelectAlert,
  selectedAlertId,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchSearch =
        searchTerm === '' ||
        (a.attack_type && a.attack_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.message && a.message.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSeverity =
        severityFilter === 'ALL' || a.severity === severityFilter;

      const matchMethod =
        methodFilter === 'ALL' || a.detection_method === methodFilter;

      return matchSearch && matchSeverity && matchMethod;
    });
  }, [alerts, searchTerm, severityFilter, methodFilter]);

  const formatBytes = (b: number) => {
    if (b >= 1_000_000_000) return `${(b / 1_000_000_000).toFixed(2)} GB`;
    if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
    if (b >= 1_000) return `${(b / 1_000).toFixed(1)} KB`;
    return `${b} B`;
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls & Filters */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-soc-text-muted" />
            <input
              type="text"
              placeholder="Filter by attack or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-soc-bg border border-soc-border text-xs text-soc-text placeholder:text-soc-text-muted focus:outline-none focus:border-soc-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (filteredAlerts.length === 0) return;
                const headers = ['ID', 'Timestamp', 'Attack Type', 'Severity', 'Detection Method', 'Src Bytes', 'Dst Bytes', 'Latency (ms)', 'Triage Status', 'Message'];
                const rows = filteredAlerts.map(a => [
                  a.id,
                  `"${a.timestamp}"`,
                  `"${a.attack_type || 'ML_ANOMALY'}"`,
                  a.severity,
                  a.detection_method,
                  a.src_bytes,
                  a.dst_bytes,
                  a.latency_ms ?? 0,
                  a.triage_status ?? 'OPEN',
                  `"${(a.message || '').replace(/"/g, '""')}"`
                ].join(','));
                const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
                const link = document.createElement('a');
                link.setAttribute('href', encodeURI(csv));
                link.setAttribute('download', `nexus_alerts_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-2.5 py-1 rounded bg-soc-bg border border-soc-border text-xs text-soc-text hover:bg-soc-card-hover transition-colors flex items-center gap-1.5 font-mono"
            >
              Export CSV
            </button>

            <div className="flex items-center gap-1.5 text-soc-text-muted">
              <Filter className="w-3.5 h-3.5" />
              <span>Severity:</span>
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2 py-1 rounded bg-soc-bg border border-soc-border text-xs text-soc-text focus:outline-none focus:border-soc-primary"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2 py-1 rounded bg-soc-bg border border-soc-border text-xs text-soc-text focus:outline-none focus:border-soc-primary"
            >
              <option value="ALL">All Methods</option>
              <option value="RULE">Rule Engine</option>
              <option value="RANDOM_FOREST">Random Forest</option>
            </select>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="border border-soc-border rounded overflow-hidden bg-soc-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-soc-border bg-soc-bg/60 text-soc-text-secondary font-mono text-[11px]">
                <th className="py-2 px-3 font-semibold w-24">TIME</th>
                <th className="py-2 px-3 font-semibold">ATTACK TYPE</th>
                <th className="py-2 px-3 font-semibold w-28">SEVERITY</th>
                <th className="py-2 px-3 font-semibold w-32">DETECTION</th>
                <th className="py-2 px-3 font-semibold text-right w-24">SRC BYTES</th>
                <th className="py-2 px-3 font-semibold text-right w-24">DST BYTES</th>
                <th className="py-2 px-3 font-semibold text-right w-20">LATENCY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/60">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-soc-text-muted">
                    No matching alerts found.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isSelected = alert.id === selectedAlertId;
                  return (
                    <tr
                      key={alert.id}
                      onClick={() => onSelectAlert(alert)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-soc-primary/10'
                          : 'hover:bg-soc-card-hover'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono text-soc-text-muted whitespace-nowrap">
                        {formatTime(alert.timestamp)}
                      </td>
                      <td className="py-2 px-3 font-medium text-soc-text whitespace-nowrap">
                        {alert.attack_type || 'ML_ANOMALY'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <SeverityBadge severity={alert.severity} />
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge
                          variant={alert.detection_method === 'RULE' ? 'warning' : 'blue'}
                        >
                          {alert.detection_method === 'RULE' ? 'Rule' : 'Random Forest'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-soc-text-secondary whitespace-nowrap">
                        {formatBytes(alert.src_bytes)}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-soc-text-secondary whitespace-nowrap">
                        {formatBytes(alert.dst_bytes)}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-soc-text-muted whitespace-nowrap">
                        {alert.latency_ms !== null ? `${alert.latency_ms.toFixed(1)}ms` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-soc-text-muted px-1">
        <span>Showing {filteredAlerts.length} of {alerts.length} stored intrusions</span>
        <span>Click row for diagnostic drawer</span>
      </div>
    </div>
  );
};
