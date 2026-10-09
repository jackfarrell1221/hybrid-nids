// components/traffic/TrafficInspector.tsx — Manual flow analyzer with deep explainability.

import React, { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { Badge } from '../common/Badge';
import type { DetectionResult, FlowInput } from '../../types';
import { Play, RotateCcw, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  onFlowAnalyzed?: () => void;
}

const PRESETS: { label: string; desc: string; flow: FlowInput }[] = [
  {
    label: 'Normal Web Session',
    desc: 'Moderate duration, balanced bytes',
    flow: { duration: 5.0, src_bytes: 900, dst_bytes: 700 },
  },
  {
    label: 'Port Scan Recon',
    desc: 'Sub-second, minimal payload (<100B)',
    flow: { duration: 0.25, src_bytes: 35, dst_bytes: 18 },
  },
  {
    label: 'DoS Ingress Flood',
    desc: 'Massive src imbalance (>10x)',
    flow: { duration: 6.0, src_bytes: 2_500_000, dst_bytes: 120 },
  },
  {
    label: 'Data Exfiltration',
    desc: 'Long connection, >10MB outbound',
    flow: { duration: 180.0, src_bytes: 600, dst_bytes: 25_000_000 },
  },
  {
    label: 'Data Theft Spike',
    desc: 'Excessive download ratio (>10x)',
    flow: { duration: 25.0, src_bytes: 250, dst_bytes: 120_000 },
  },
];

export const TrafficInspector: React.FC<Props> = ({ onFlowAnalyzed }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState<FlowInput>({
    duration: 5.0,
    src_bytes: 900,
    dst_bytes: 700,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FlowInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseFloat(e.target.value);
    setForm((prev) => ({ ...prev, [field]: isNaN(val) ? 0 : val }));
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predict(form);
      setResult(res);
      if (res.status === 'INTRUSION') {
        addToast(
          'warning',
          `Intrusion Detected: ${res.attack_type || 'ML_ANOMALY'}`,
          `Method: ${res.detection_method} (${res.latency_ms?.toFixed(2)}ms)`
        );
      } else {
        addToast(
          'success',
          'Flow Verified: NORMAL',
          `Allowed by ${res.detection_method}`
        );
      }
      onFlowAnalyzed?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      addToast('error', 'Inspection Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ duration: 0, src_bytes: 0, dst_bytes: 0 });
    setResult(null);
    setError(null);
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setForm(preset.flow);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Preset Quick Fill */}
      <div>
        <label className="text-[11px] font-mono font-semibold text-soc-text-secondary uppercase tracking-wider block mb-2">
          Testbed Traffic Profiles
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(p)}
              className="text-left p-2 rounded border border-soc-border bg-soc-card hover:bg-soc-card-hover transition-colors flex flex-col justify-between"
            >
              <span className="text-xs font-medium text-soc-text">{p.label}</span>
              <span className="text-[10px] text-soc-text-muted mt-1 leading-tight">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column */}
        <div className="lg:col-span-6 space-y-4">
          <form
            onSubmit={handleAnalyze}
            className="p-4 rounded border border-soc-border bg-soc-card space-y-4"
          >
            <div className="flex items-center justify-between border-b border-soc-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-soc-text">Flow Parameters</h3>
                <p className="text-xs text-soc-text-secondary">Input initial 3-tuple features</p>
              </div>
              <Activity className="w-4 h-4 text-soc-text-muted" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-soc-text-secondary mb-1">
                  duration (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={form.duration}
                  onChange={handleInputChange('duration')}
                  className="w-full px-3 py-1.5 rounded bg-soc-bg border border-soc-border text-xs font-mono text-soc-text focus:outline-none focus:border-soc-primary transition-colors"
                  placeholder="e.g. 5.0"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-soc-text-secondary mb-1">
                  src_bytes (inbound bytes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.src_bytes}
                  onChange={handleInputChange('src_bytes')}
                  className="w-full px-3 py-1.5 rounded bg-soc-bg border border-soc-border text-xs font-mono text-soc-text focus:outline-none focus:border-soc-primary transition-colors"
                  placeholder="e.g. 900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-soc-text-secondary mb-1">
                  dst_bytes (outbound bytes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.dst_bytes}
                  onChange={handleInputChange('dst_bytes')}
                  className="w-full px-3 py-1.5 rounded bg-soc-bg border border-soc-border text-xs font-mono text-soc-text focus:outline-none focus:border-soc-primary transition-colors"
                  placeholder="e.g. 700"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-soc-primary hover:bg-soc-primary-hover text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{loading ? 'Evaluating Pipeline...' : 'Analyze Flow'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded border border-soc-border hover:bg-soc-card-hover text-soc-text-secondary text-xs transition-colors"
                title="Reset values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 rounded border border-red-300 dark:border-red-900/60 bg-red-500/10 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Diagnostic Output Column */}
        <div className="lg:col-span-6">
          <div className="h-full p-4 rounded border border-soc-border bg-soc-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-soc-border pb-3 mb-4">
                <h3 className="text-sm font-semibold text-soc-text">Detection Verdict</h3>
                {result && (
                  <Badge variant={result.status === 'INTRUSION' ? 'critical' : 'success'}>
                    {result.status}
                  </Badge>
                )}
              </div>

              {!result && !loading && (
                <div className="py-16 text-center text-soc-text-muted">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">
                    Specify flow attributes and click <span className="text-soc-text">Analyze Flow</span> to trigger inspection.
                  </p>
                </div>
              )}

              {loading && (
                <div className="py-16 text-center text-soc-text-secondary font-mono text-xs">
                  Running Stage 1 (Deterministic Rules) → Stage 2 (Random Forest) ...
                </div>
              )}

              {result && !loading && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-3 rounded border flex items-center justify-between ${
                      result.status === 'INTRUSION'
                        ? 'bg-red-500/10 border-red-300 dark:border-red-900/60 text-red-700 dark:text-red-400'
                        : 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-mono block">Classification</span>
                      <span className="text-base font-bold font-mono">
                        {result.attack_type || (result.status === 'NORMAL' ? 'LEGITIMATE TRAFFIC' : 'ML_ANOMALY')}
                      </span>
                    </div>
                    <SeverityBadge severity={result.severity} size="md" />
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded border border-soc-border bg-soc-bg/40">
                      <span className="text-soc-text-muted text-[10px] block">METHOD</span>
                      <span className="font-semibold text-soc-text">{result.detection_method}</span>
                    </div>

                    <div className="p-2 rounded border border-soc-border bg-soc-bg/40">
                      <span className="text-soc-text-muted text-[10px] block">PIPELINE LATENCY</span>
                      <span className="font-semibold text-soc-text">{result.latency_ms?.toFixed(2)} ms</span>
                    </div>
                  </div>

                  {/* Explainability Block */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-soc-text uppercase font-mono tracking-tight">
                      Reasoning & Evidence
                    </span>
                    <div className="p-3 rounded border border-soc-border bg-soc-bg/50 text-xs leading-relaxed text-soc-text">
                      {result.message}
                    </div>
                  </div>

                  {/* Anomaly Score if ML */}
                  {result.anomaly_score !== undefined && (
                    <div className="flex items-center justify-between text-xs font-mono p-2 rounded border border-soc-border bg-soc-bg/20">
                      <span className="text-soc-text-secondary">Random Forest Anomaly Score:</span>
                      <span className="font-semibold text-soc-text">{result.anomaly_score.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-soc-border flex items-center justify-between text-[10px] font-mono text-soc-text-muted">
              <span>ORDER: Deterministic Rules → Random Forest</span>
              <span>SCHEMA: RFC Flow 3-Tuple</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
