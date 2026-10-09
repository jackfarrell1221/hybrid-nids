// components/AttackSimulator.tsx — Local attack scenario simulator panel.

import React, { useState } from 'react';
import { api } from '../services/api';
import type { DetectionResult } from '../types';
import SeverityBadge from './SeverityBadge';

type Scenario = 'normal' | 'port_scan' | 'dos' | 'data_exfiltration' | 'data_theft' | 'full';

const SCENARIOS: { id: Scenario; label: string; color: string }[] = [
  { id: 'normal',            label: 'Normal',           color: 'border-emerald-700/60 hover:border-emerald-500 text-emerald-400' },
  { id: 'port_scan',         label: 'Port Scan',        color: 'border-orange-700/60 hover:border-orange-500 text-orange-400' },
  { id: 'dos',               label: 'DoS',              color: 'border-red-700/60 hover:border-red-500 text-red-400' },
  { id: 'data_exfiltration', label: 'Data Exfiltration',color: 'border-red-700/60 hover:border-red-500 text-red-400' },
  { id: 'data_theft',        label: 'Data Theft',       color: 'border-orange-700/60 hover:border-orange-500 text-orange-400' },
  { id: 'full',              label: 'Run Full Simulation', color: 'border-nids-blue/60 hover:border-nids-blue text-nids-blue' },
];

const AttackSimulator: React.FC<{ onSimulated?: () => void }> = ({ onSimulated }) => {
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScenario = async (scenario: Scenario) => {
    setLoading(scenario);
    setError(null);
    try {
      const res = await api.simulate(scenario, scenario === 'full' ? 1 : 2);
      setResults(res.results);
      onSimulated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="bg-nids-surface border border-nids-border rounded p-4">
      <h2 className="text-sm font-semibold text-nids-muted uppercase tracking-wider mb-3">
        Attack Simulator
      </h2>
      <p className="text-xs text-nids-muted mb-3">
        Generates synthetic flows locally — no real network traffic.
      </p>

      {/* Scenario buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => runScenario(s.id)}
            disabled={loading !== null}
            className={`border rounded px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 bg-nids-bg ${s.color}`}
          >
            {loading === s.id ? 'Running…' : s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-nids-red bg-red-950/30 border border-red-900/40 rounded px-3 py-2 mb-3">
          ✗ {error}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-nids-border text-nids-muted">
                <th className="text-left py-1 pr-3">Status</th>
                <th className="text-left py-1 pr-3">Attack</th>
                <th className="text-left py-1 pr-3">Method</th>
                <th className="text-left py-1 pr-3">Severity</th>
                <th className="text-right py-1">Latency</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-nids-border/40">
                  <td className={`py-1 pr-3 mono font-semibold ${r.status === 'INTRUSION' ? 'text-nids-red' : 'text-nids-green'}`}>
                    {r.status}
                  </td>
                  <td className="py-1 pr-3 mono text-nids-text">{r.attack_type ?? '—'}</td>
                  <td className="py-1 pr-3 text-nids-muted">{r.detection_method}</td>
                  <td className="py-1 pr-3"><SeverityBadge severity={r.severity} /></td>
                  <td className="py-1 text-right mono text-nids-muted">{r.latency_ms?.toFixed(1)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center text-nids-muted text-xs py-4">
          Click a scenario to simulate traffic
        </div>
      )}
    </section>
  );
};

export default AttackSimulator;
