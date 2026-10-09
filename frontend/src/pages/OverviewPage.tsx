import { useEffect, useState, useCallback } from 'react';
import { Shield, Activity, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { Statistics, Alert, SystemHealthInfo } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusIndicator } from '../components/common/StatusIndicator';
import AttackDistributionChart from '../components/charts/AttackDistributionChart';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'primary' | 'critical' | 'warning' | 'success';
}

function MetricCard({ label, value, sub, icon, accent = 'primary' }: MetricCardProps) {
  const accentMap: Record<string, string> = {
    primary: 'text-soc-primary',
    critical: 'text-soc-critical',
    warning: 'text-soc-warning',
    success: 'text-soc-success',
  };
  return (
    <div className="bg-soc-card border border-soc-border rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-soc-text-secondary uppercase tracking-wider">{label}</span>
        <span className={`${accentMap[accent]} opacity-70`}>{icon}</span>
      </div>
      <div className={`text-2xl font-semibold font-mono ${accentMap[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-soc-text-muted mt-1">{sub}</div>}
    </div>
  );
}

function MethodBreakdown({ stats }: { stats: Statistics }) {
  const total = stats.intrusion_flows;
  const rule = stats.rule_detections;
  const ml = stats.ml_detections;
  const rulePercent = total > 0 ? Math.round((rule / total) * 100) : 0;
  const mlPercent = total > 0 ? Math.round((ml / total) * 100) : 0;

  return (
    <div className="bg-soc-card border border-soc-border rounded p-4">
      <h3 className="text-sm font-semibold text-soc-text mb-4">Detection Method Breakdown</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-soc-text-secondary mb-1">
            <span>Rule Engine</span>
            <span className="font-mono">{rule} ({rulePercent}%)</span>
          </div>
          <div className="h-1.5 bg-soc-border rounded-full overflow-hidden">
            <div className="h-full bg-soc-primary rounded-full transition-all duration-500" style={{ width: `${rulePercent}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-soc-text-secondary mb-1">
            <span>Random Forest</span>
            <span className="font-mono">{ml} ({mlPercent}%)</span>
          </div>
          <div className="h-1.5 bg-soc-border rounded-full overflow-hidden">
            <div className="h-full bg-soc-warning rounded-full transition-all duration-500" style={{ width: `${mlPercent}%` }} />
          </div>
        </div>
        <div className="pt-2 border-t border-soc-border">
          <div className="flex justify-between text-xs text-soc-text-secondary">
            <span>Total intrusions</span>
            <span className="font-mono text-soc-critical">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type CompStatus = 'operational' | 'critical' | 'neutral';

function compStatus(status: string): CompStatus {
  if (status === 'operational') return 'operational';
  if (status === 'not_loaded' || status === 'initializing') return 'neutral';
  return 'critical';
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<SystemHealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, a, h] = await Promise.all([
        api.statistics(),
        api.alerts(15),
        api.systemHealth(),
      ]);
      setStats(s);
      setAlerts(a.alerts);
      setHealth(h);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) return <LoadingState message="Loading overview..." />;
  if (error && !stats) return <ErrorState message={error} onRetry={load} />;

  const detectionRate = stats && stats.total_flows > 0
    ? `${stats.detection_percentage.toFixed(1)}%`
    : '—';

  const avgLatency = stats?.avg_latency_ms != null
    ? `${stats.avg_latency_ms.toFixed(1)} ms`
    : '—';

  const comps = health?.components;

  const statusPills = [
    { label: 'API', status: comps ? compStatus(comps.api.status) : 'neutral' as CompStatus },
    { label: 'Detection Engine', status: comps ? compStatus(comps.rule_engine.status) : 'neutral' as CompStatus },
    { label: 'ML Model', status: comps ? compStatus(comps.ml_detector.status) : 'neutral' as CompStatus },
    { label: 'Database', status: comps ? compStatus(comps.database.status) : 'neutral' as CompStatus },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Security Overview</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">Network detection and response activity</p>
      </div>

      {/* System status pills */}
      <div className="flex flex-wrap gap-2">
        {statusPills.map(({ label, status }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-1.5 bg-soc-card border border-soc-border rounded text-xs text-soc-text-secondary"
          >
            <StatusIndicator status={status} size="sm" />
            {label}
            <span className={`font-mono text-xs ${
              status === 'operational' ? 'text-soc-success' :
              status === 'critical' ? 'text-soc-critical' : 'text-soc-text-muted'
            }`}>
              {status === 'operational' ? 'operational' : status === 'critical' ? 'degraded' : 'unknown'}
            </span>
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Flows"
          value={stats?.total_flows ?? '—'}
          sub="analyzed"
          icon={<Activity size={16} />}
          accent="primary"
        />
        <MetricCard
          label="Intrusions"
          value={stats?.intrusion_flows ?? '—'}
          sub="detected"
          icon={<AlertTriangle size={16} />}
          accent="critical"
        />
        <MetricCard
          label="Detection Rate"
          value={detectionRate}
          sub={stats && stats.total_flows > 0 ? `of ${stats.total_flows} flows` : 'no flows yet'}
          icon={<Shield size={16} />}
          accent="warning"
        />
        <MetricCard
          label="Avg Latency"
          value={avgLatency}
          sub="per flow"
          icon={<Clock size={16} />}
          accent="success"
        />
      </div>

      {/* Recent alerts + attack distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent alerts table */}
        <div className="xl:col-span-2 bg-soc-card border border-soc-border rounded">
          <div className="px-4 py-3 border-b border-soc-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-soc-text">Recent Security Activity</h2>
            <span className="text-xs text-soc-text-muted">{alerts.length} shown</span>
          </div>
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-soc-text-muted">
              No alerts yet. Run a simulation to generate traffic.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-soc-border">
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Severity</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Attack Type</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Method</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Latency</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-soc-border-subtle hover:bg-soc-card-hover transition-colors">
                      <td className="px-4 py-2">
                        <SeverityBadge severity={alert.severity} />
                      </td>
                      <td className="px-4 py-2 font-mono text-soc-text">{alert.attack_type ?? 'UNKNOWN'}</td>
                      <td className="px-4 py-2 text-soc-text-secondary">{alert.detection_method}</td>
                      <td className="px-4 py-2 font-mono text-soc-text-secondary">
                        {alert.latency_ms != null ? `${alert.latency_ms.toFixed(1)}ms` : '—'}
                      </td>
                      <td className="px-4 py-2 text-soc-text-muted">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: attack chart + method breakdown */}
        <div className="space-y-4">
          {stats && <AttackDistributionChart stats={stats} />}
          {stats && <MethodBreakdown stats={stats} />}
        </div>
      </div>
    </div>
  );
}
