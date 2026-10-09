// components/DetectionPanel.tsx — Real-time flow analysis input panel.

import React, { useState } from 'react';
import { api } from '../services/api';
import type { DetectionResult, FlowInput } from '../types';
import SeverityBadge from './SeverityBadge';

const DetectionPanel: React.FC = () => {
  const [form, setForm] = useState<FlowInput>({
    duration: 5,
    src_bytes: 900,
    dst_bytes: 700,
  });
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof FlowInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.predict(form);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const statusColor =
    result?.status === 'INTRUSION'
      ? 'text-nids-red border-nids-red/30 bg-red-950/20'
      : result?.status === 'NORMAL'
      ? 'text-nids-green border-nids-green/30 bg-emerald-950/20'
      : 'text-nids-muted border-nids-border bg-nids-surface';

  return (
    <section className="bg-nids-surface border border-nids-border rounded p-4">
      <h2 className="text-sm font-semibold text-nids-muted uppercase tracking-wider mb-3">
        Real-Time Detection
      </h2>

      {/* Input fields */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {(['duration', 'src_bytes', 'dst_bytes'] as const).map((field) => (
          <div key={field}>
            <label className="block text-xs text-nids-muted mb-1 uppercase tracking-wide">
              {field.replace('_', ' ')}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form[field]}
              onChange={handleChange(field)}
              className="w-full bg-nids-bg border border-nids-border rounded px-3 py-2 text-sm mono text-nids-text focus:outline-none focus:border-nids-blue"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-nids-blue hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded px-4 py-2 transition-colors"
      >
        {loading ? 'Analyzing…' : 'Analyze Traffic'}
      </button>

      {/* Error state */}
      {error && (
        <div className="mt-3 text-sm text-nids-red bg-red-950/30 border border-red-900/40 rounded px-3 py-2">
          ✗ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-4 border rounded p-3 ${statusColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold mono">{result.status}</span>
            <SeverityBadge severity={result.severity} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
            <div>
              <span className="text-nids-muted">Attack Type: </span>
              <span className="mono">{result.attack_type ?? '—'}</span>
            </div>
            <div>
              <span className="text-nids-muted">Method: </span>
              <span className="mono">{result.detection_method}</span>
            </div>
            <div>
              <span className="text-nids-muted">Latency: </span>
              <span className="mono">{result.latency_ms?.toFixed(2)} ms</span>
            </div>
            {result.anomaly_score !== undefined && result.anomaly_score !== null && (
              <div>
                <span className="text-nids-muted">Anomaly Score: </span>
                <span className="mono">{result.anomaly_score.toFixed(4)}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-nids-muted leading-relaxed">{result.message}</p>
        </div>
      )}
    </section>
  );
};

export default DetectionPanel;
