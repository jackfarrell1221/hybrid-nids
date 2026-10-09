import React, { useEffect, useState, useCallback } from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { Rule } from '../types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';

const severityColor: Record<string, string> = {
  CRITICAL: 'text-soc-critical',
  HIGH: 'text-soc-critical',
  MEDIUM: 'text-soc-warning',
  LOW: 'text-soc-success',
};

const attackColor: Record<string, string> = {
  PORT_SCAN: 'bg-soc-primary/10 text-soc-primary border-soc-primary/30',
  DATA_EXFILTRATION: 'bg-soc-critical/10 text-soc-critical border-soc-critical/30',
  DOS: 'bg-soc-warning/10 text-soc-warning border-soc-warning/30',
  DATA_THEFT: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.rules();
      setRules(data.rules ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading detection rules..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (rules.length === 0) return <EmptyState title="No rules found" description="Detection rules are configured in the backend." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Detection Rules</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">
          Deterministic rule engine — first-match wins. Rules execute before ML inference.
        </p>
      </div>

      {/* Pipeline explanation */}
      <div className="bg-soc-card border border-soc-border rounded p-4">
        <h2 className="text-xs font-semibold text-soc-text-secondary uppercase tracking-wider mb-3">Detection Pipeline</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-soc-text-secondary">
          {['Input Flow', 'Validate', 'Sanitize', 'Rule Engine', 'Random Forest', 'Persist Alert'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span className={`px-2 py-1 rounded border ${i === 3 ? 'bg-soc-primary/10 text-soc-primary border-soc-primary/30' : 'bg-soc-card-hover border-soc-border text-soc-text'}`}>
                {step}
              </span>
              {i < arr.length - 1 && <ChevronRight size={12} className="text-soc-text-muted" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-soc-text-muted mt-3">
          Each incoming flow is checked against all {rules.length} rules in priority order.
          If a rule matches, the flow is classified as an intrusion with the rule's severity and attack type.
          Only flows that pass all rules are sent to the Random Forest model for anomaly scoring.
        </p>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map((rule, idx) => (
          <div key={rule.id ?? rule.name ?? idx} className="bg-soc-card border border-soc-border rounded p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-soc-text-muted bg-soc-border rounded px-2 py-0.5">
                  #{rule.priority ?? idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-soc-text">{rule.name}</h3>
                  <p className="text-xs text-soc-text-secondary mt-0.5">{rule.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {rule.attack_type && (
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono ${attackColor[rule.attack_type] ?? 'bg-soc-card-hover text-soc-text border-soc-border'}`}>
                    {rule.attack_type}
                  </span>
                )}
                <span className={`text-xs font-semibold ${severityColor[rule.severity] ?? 'text-soc-text-secondary'}`}>
                  {rule.severity}
                </span>
              </div>
            </div>

            {(rule.conditions || rule.thresholds) && (
              <div className="bg-soc-bg rounded border border-soc-border p-3">
                <div className="text-xs font-mono text-soc-text-secondary mb-1">Condition</div>
                <pre className="text-xs font-mono text-soc-text whitespace-pre-wrap break-all">
                  {rule.conditions ?? JSON.stringify(rule.thresholds, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-soc-card border border-soc-border rounded p-4 text-xs text-soc-text-secondary">
        <Shield size={14} className="inline mr-1.5 text-soc-text-muted" />
        Rules are read-only and defined in <code className="font-mono text-soc-text bg-soc-border rounded px-1">backend/services/rule_engine.py</code>.
        To add or modify rules, edit that file and restart the Flask server.
      </div>
    </div>
  );
}
