import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Statistics } from '../types';
import AttackDistributionChart from '../components/charts/AttackDistributionChart';
import TrafficSplitChart from '../components/charts/TrafficSplitChart';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await api.statistics();
      setStats(s);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) return <LoadingState message="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats || stats.total_flows === 0)
    return <EmptyState title="No analytics data" description="Run traffic flows or simulations to populate analytics." />;

  const rule = stats.rule_detections;
  const ml = stats.ml_detections;
  const total = stats.intrusion_flows;

  const attackRows = Object.entries(stats.attack_distribution).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Analytics</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">
          Detection breakdown and traffic distribution
        </p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Flows', value: stats.total_flows },
          { label: 'Normal Flows', value: stats.normal_flows },
          { label: 'Intrusions', value: stats.intrusion_flows },
          { label: 'Avg Latency', value: `${stats.avg_latency_ms?.toFixed(1) ?? '—'} ms` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-soc-card border border-soc-border rounded p-4">
            <div className="text-xs text-soc-text-secondary mb-2">{label}</div>
            <div className="text-xl font-mono font-semibold text-soc-text">{value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttackDistributionChart stats={stats} />
        <TrafficSplitChart stats={stats} />
      </div>

      {/* Detection method table */}
      <div className="bg-soc-card border border-soc-border rounded">
        <div className="px-4 py-3 border-b border-soc-border">
          <h2 className="text-sm font-semibold text-soc-text">Detection Method Summary</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-soc-border">
              <th className="text-left px-4 py-2 text-xs font-medium text-soc-text-secondary">Method</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-soc-text-secondary">Count</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-soc-text-secondary">Share</th>
              <th className="px-4 py-2 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {[
              { method: 'Rule Engine', count: rule, color: 'bg-soc-primary' },
              { method: 'Random Forest', count: ml, color: 'bg-soc-warning' },
            ].map(({ method, count, color }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <tr key={method} className="border-b border-soc-border-subtle">
                  <td className="px-4 py-2.5 text-soc-text">{method}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-soc-text">{count}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-soc-text-secondary">{pct}%</td>
                  <td className="px-4 py-2.5">
                    <div className="h-1.5 bg-soc-border rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Attack type breakdown */}
      {attackRows.length > 0 && (
        <div className="bg-soc-card border border-soc-border rounded">
          <div className="px-4 py-3 border-b border-soc-border">
            <h2 className="text-sm font-semibold text-soc-text">Attack Type Distribution</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-soc-border">
                <th className="text-left px-4 py-2 text-xs font-medium text-soc-text-secondary">Attack Type</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-soc-text-secondary">Count</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-soc-text-secondary">Share of Intrusions</th>
              </tr>
            </thead>
            <tbody>
              {attackRows.map(([type, count]) => {
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={type} className="border-b border-soc-border-subtle">
                    <td className="px-4 py-2.5 font-mono text-soc-text">{type}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-soc-text">{count}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-soc-text-secondary">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
