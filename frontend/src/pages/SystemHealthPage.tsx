import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { SystemHealthInfo } from '../types';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { LoadingState } from '../components/common/LoadingState';

interface EndpointProbe {
  path: string;
  label: string;
  status: 'ok' | 'error' | 'pending';
  latencyMs: number | null;
  statusCode: number | null;
}

const PROBES: { path: string; label: string }[] = [
  { path: '/api/health', label: 'Health Check' },
  { path: '/api/statistics', label: 'Statistics' },
  { path: '/api/alerts?limit=1', label: 'Alerts' },
  { path: '/api/rules', label: 'Rules' },
  { path: '/api/model/info', label: 'Model Info' },
  { path: '/api/system/health', label: 'System Health' },
  { path: '/api/simulate/scenarios', label: 'Scenarios' },
  { path: '/api/evaluation', label: 'Evaluation' },
];

async function probeEndpoint(path: string): Promise<{ status: 'ok' | 'error'; latencyMs: number; statusCode: number }> {
  const start = performance.now();
  try {
    const res = await fetch(path);
    const latencyMs = Math.round(performance.now() - start);
    return { status: res.ok ? 'ok' : 'error', latencyMs, statusCode: res.status };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return { status: 'error', latencyMs, statusCode: 0 };
  }
}

type CompStatus = 'operational' | 'critical' | 'neutral';

function statusFromString(s: string): CompStatus {
  if (s === 'operational') return 'operational';
  if (s === 'not_loaded' || s === 'initializing') return 'neutral';
  return 'critical';
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthInfo | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [probes, setProbes] = useState<EndpointProbe[]>(
    PROBES.map(p => ({ ...p, status: 'pending', latencyMs: null, statusCode: null }))
  );
  const [probing, setProbing] = useState(false);

  const loadHealth = useCallback(async () => {
    try {
      const data = await api.systemHealth();
      setHealth(data);
      setHealthError(null);
    } catch (e: any) {
      setHealthError(e.message ?? 'Failed to load system health');
    } finally {
      setLoading(false);
    }
  }, []);

  const runProbes = useCallback(async () => {
    setProbing(true);
    setProbes(PROBES.map(p => ({ ...p, status: 'pending', latencyMs: null, statusCode: null })));
    const results = await Promise.all(PROBES.map(p => probeEndpoint(p.path)));
    setProbes(PROBES.map((p, i) => ({ ...p, ...results[i] })));
    setProbing(false);
  }, []);

  useEffect(() => {
    loadHealth();
    runProbes();
  }, [loadHealth, runProbes]);

  if (loading) return <LoadingState message="Checking system health..." />;

  const comps = health?.components;
  const overallOk = health?.status === 'operational';

  const statusTiles = [
    { key: 'api', label: 'API Server', status: comps ? statusFromString(comps.api.status) : 'neutral' as CompStatus, sub: comps?.api.name },
    { key: 'rule_engine', label: 'Rule Engine', status: comps ? statusFromString(comps.rule_engine.status) : 'neutral' as CompStatus, sub: comps ? `${comps.rule_engine.active_rules} rules` : undefined },
    { key: 'ml_detector', label: 'ML Model', status: comps ? statusFromString(comps.ml_detector.status) : 'neutral' as CompStatus, sub: comps ? (comps.ml_detector.ready ? 'ready' : 'not ready') : undefined },
    { key: 'database', label: 'Database', status: comps ? statusFromString(comps.database.status) : 'neutral' as CompStatus, sub: comps?.database.type },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-soc-text">System Health</h1>
          <p className="text-sm text-soc-text-secondary mt-0.5">
            Component status and API endpoint probes
          </p>
        </div>
        <button
          onClick={() => { loadHealth(); runProbes(); }}
          disabled={probing}
          className="flex items-center gap-2 px-3 py-1.5 border border-soc-border rounded text-sm text-soc-text-secondary hover:text-soc-text hover:bg-soc-card-hover transition-colors"
        >
          <Clock size={13} className={probing ? 'animate-spin' : ''} />
          {probing ? 'Probing...' : 'Refresh'}
        </button>
      </div>

      {healthError && (
        <div className="bg-soc-critical/10 border border-soc-critical/30 rounded px-4 py-3 text-sm text-soc-critical">
          {healthError}
        </div>
      )}

      {/* Overall status */}
      <div className={`bg-soc-card border rounded p-4 flex items-center gap-3 ${overallOk ? 'border-soc-success/40' : 'border-soc-warning/40'}`}>
        {overallOk
          ? <CheckCircle size={20} className="text-soc-success" />
          : <XCircle size={20} className="text-soc-warning" />
        }
        <div>
          <div className="text-sm font-semibold text-soc-text">
            {overallOk ? 'All systems operational' : `System status: ${health?.status ?? 'unknown'}`}
          </div>
          {health?.timestamp && (
            <div className="text-xs text-soc-text-muted mt-0.5">
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Component tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusTiles.map(({ key, label, status, sub }) => (
          <div key={key} className="bg-soc-card border border-soc-border rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <StatusIndicator status={status} size="sm" />
              <span className="text-xs text-soc-text-secondary">{label}</span>
            </div>
            <div className={`text-sm font-semibold ${
              status === 'operational' ? 'text-soc-success' :
              status === 'critical' ? 'text-soc-critical' : 'text-soc-text-muted'
            }`}>
              {status === 'operational' ? 'Operational' : status === 'critical' ? 'Degraded' : 'Unknown'}
            </div>
            {sub && <div className="text-xs text-soc-text-muted mt-1">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Endpoint probe table */}
      <div className="bg-soc-card border border-soc-border rounded">
        <div className="px-4 py-3 border-b border-soc-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-soc-text">API Endpoint Probes</h2>
          <span className="text-xs text-soc-text-muted">
            {probes.filter(p => p.status === 'ok').length}/{probes.length} reachable
          </span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-soc-border">
              <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Endpoint</th>
              <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Path</th>
              <th className="text-right px-4 py-2 font-medium text-soc-text-secondary">HTTP</th>
              <th className="text-right px-4 py-2 font-medium text-soc-text-secondary">Latency</th>
            </tr>
          </thead>
          <tbody>
            {probes.map((p) => (
              <tr key={p.path} className="border-b border-soc-border-subtle">
                <td className="px-4 py-2.5 text-soc-text">{p.label}</td>
                <td className="px-4 py-2.5 font-mono text-soc-text-secondary">{p.path}</td>
                <td className="px-4 py-2.5 text-right">
                  {p.status === 'pending'
                    ? <span className="text-soc-text-muted">—</span>
                    : p.status === 'ok'
                      ? <span className="text-soc-success font-semibold">{p.statusCode}</span>
                      : <span className="text-soc-critical font-semibold">{p.statusCode || 'ERR'}</span>
                  }
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-soc-text-secondary">
                  {p.latencyMs != null ? `${p.latencyMs}ms` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
