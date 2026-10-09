// components/alerts/AlertDrawer.tsx — Slide-over drawer with full alert telemetry and explainability.

import React from 'react';
import { Drawer } from '../common/Drawer';
import { SeverityBadge } from '../common/SeverityBadge';
import { Badge } from '../common/Badge';
import type { Alert } from '../../types';
import { ShieldAlert, Activity, Cpu, Database } from 'lucide-react';

interface Props {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onTriageUpdate?: (alertId: number, status: string) => void;
}

export const AlertDrawer: React.FC<Props> = ({ alert, isOpen, onClose, onTriageUpdate }) => {
  if (!alert) return null;

  const isRule = alert.detection_method === 'RULE';
  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={alert.attack_type || 'ANOMALOUS ACTIVITY'}
      subtitle={`Alert ID: #${alert.id} • ${formatTime(alert.timestamp)}`}
      width="max-w-md"
    >
      {/* Triage Actions */}
      <div className="flex items-center justify-between p-2.5 rounded border border-soc-border bg-soc-card">
        <span className="text-xs font-semibold text-soc-text-secondary">Triage Status:</span>
        <div className="flex gap-1.5 text-xs font-mono">
          {(['ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onTriageUpdate && onTriageUpdate(alert.id, status)}
              className={`px-2 py-0.5 rounded border text-[10px] font-semibold transition-colors ${
                alert.triage_status === status
                  ? 'bg-soc-primary text-white border-soc-primary'
                  : 'bg-soc-bg border-soc-border text-soc-text-secondary hover:text-soc-text'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Primary summary strip */}
      <div className="flex items-center justify-between p-3 rounded border border-soc-border bg-soc-bg/50">
        <div>
          <span className="text-[10px] font-mono text-soc-text-muted uppercase block">
            Severity
          </span>
          <div className="mt-1">
            <SeverityBadge severity={alert.severity} size="md" />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-soc-text-muted uppercase block">
            Method
          </span>
          <div className="mt-1">
            <Badge variant={isRule ? 'warning' : 'blue'}>
              {alert.detection_method}
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-soc-text-muted uppercase block">
            Latency
          </span>
          <span className="text-xs font-mono font-medium text-soc-text block mt-1">
            {alert.latency_ms !== null ? `${alert.latency_ms.toFixed(2)} ms` : '—'}
          </span>
        </div>
      </div>

      {/* Traffic Feature Breakdown */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-soc-text tracking-tight uppercase font-mono">
          <Activity className="w-3.5 h-3.5 text-soc-primary" />
          <span>Observed Flow Features (3-Tuple)</span>
        </div>

        <div className="border border-soc-border rounded overflow-hidden divide-y divide-soc-border text-xs">
          <div className="flex items-center justify-between px-3 py-2 bg-soc-card">
            <span className="text-soc-text-secondary">Duration</span>
            <span className="font-mono font-medium text-soc-text">
              {alert.duration.toFixed(3)}s
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-soc-card">
            <span className="text-soc-text-secondary">Source Bytes (Inbound)</span>
            <span className="font-mono font-medium text-soc-text">
              {alert.src_bytes.toLocaleString()} B
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-soc-card">
            <span className="text-soc-text-secondary">Destination Bytes (Outbound)</span>
            <span className="font-mono font-medium text-soc-text">
              {alert.dst_bytes.toLocaleString()} B
            </span>
          </div>
          {alert.anomaly_score !== null && alert.anomaly_score !== undefined && (
            <div className="flex items-center justify-between px-3 py-2 bg-soc-card">
              <span className="text-soc-text-secondary">ML Anomaly Score</span>
              <span className="font-mono font-medium text-amber-500">
                {alert.anomaly_score.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Detection Reasoning & Explainability */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-soc-text tracking-tight uppercase font-mono">
          {isRule ? (
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
          ) : (
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span>{isRule ? 'Rule Match Analysis' : 'Random Forest Outlier Explanation'}</span>
        </div>

        <div className="p-3 rounded border border-soc-border bg-soc-bg/40 text-xs leading-relaxed text-soc-text">
          {alert.message || 'No extended reasoning provided.'}
        </div>
      </section>

      {/* Technical Evidence Trace */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-soc-text tracking-tight uppercase font-mono">
          <Database className="w-3.5 h-3.5 text-soc-text-muted" />
          <span>Audit Persistence Record</span>
        </div>

        <div className="p-3 rounded border border-soc-border bg-soc-bg/20 font-mono text-[11px] text-soc-text-secondary space-y-1">
          <div>TABLE: alerts</div>
          <div>DATABASE: data/nids.db</div>
          <div>STATUS: INTRUSION (VERIFIED)</div>
        </div>
      </section>
    </Drawer>
  );
};
