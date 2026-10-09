import { useEffect, useState, useCallback } from 'react';
import { BarChart2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { EvaluationResult } from '../types';
import { LoadingState } from '../components/common/LoadingState';

function MetricTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-soc-card border border-soc-border rounded p-4">
      <div className="text-xs text-soc-text-secondary mb-2">{label}</div>
      <div className="text-2xl font-mono font-semibold text-soc-primary">{value}</div>
      {sub && <div className="text-xs text-soc-text-muted mt-1">{sub}</div>}
    </div>
  );
}

function ConfusionMatrix({ matrix, labels }: { matrix: number[][]; labels: string[] }) {
  // matrix[0] = actual NORMAL row, matrix[1] = actual INTRUSION row
  // cols: [predicted NORMAL, predicted INTRUSION]
  const tn = matrix[0]?.[0] ?? 0;
  const fp = matrix[0]?.[1] ?? 0;
  const fn = matrix[1]?.[0] ?? 0;
  const tp = matrix[1]?.[1] ?? 0;

  const cells = [
    { label: 'TP', value: tp, desc: 'True Positive', bg: 'bg-soc-success/10 text-soc-success border-soc-success/30' },
    { label: 'FP', value: fp, desc: 'False Positive', bg: 'bg-soc-warning/10 text-soc-warning border-soc-warning/30' },
    { label: 'FN', value: fn, desc: 'False Negative', bg: 'bg-soc-critical/10 text-soc-critical border-soc-critical/30' },
    { label: 'TN', value: tn, desc: 'True Negative', bg: 'bg-soc-primary/10 text-soc-primary border-soc-primary/30' },
  ];

  return (
    <div className="bg-soc-card border border-soc-border rounded p-4">
      <h2 className="text-sm font-semibold text-soc-text mb-4">Confusion Matrix</h2>
      <div className="grid grid-cols-2 gap-2 max-w-xs">
        {cells.map(({ label, value, desc, bg }) => (
          <div key={label} className={`border rounded p-3 text-center ${bg}`}>
            <div className="text-2xl font-mono font-semibold">{value}</div>
            <div className="text-xs font-semibold mt-1">{label}</div>
            <div className="text-xs opacity-70">{desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-soc-text-muted">
        Labels: {labels.join(', ')} — rows=actual, cols=predicted
      </div>
    </div>
  );
}

export default function EvaluationPage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.evaluation();
      setResult(data);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading evaluation results..." />;

  if (notFound || !result) return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Model Evaluation</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">Offline benchmark results from the test dataset</p>
      </div>
      <div className="bg-soc-card border border-soc-border rounded p-6 text-sm text-soc-text-secondary">
        <AlertTriangle size={16} className="inline mr-2 text-soc-warning" />
        No evaluation results found. Run the evaluation script first:
        <pre className="mt-3 p-3 bg-soc-bg rounded border border-soc-border font-mono text-xs text-soc-text">
          .venv\Scripts\python scripts\evaluate.py
        </pre>
        <p className="mt-2 text-xs text-soc-text-muted">
          This generates <code className="font-mono bg-soc-border rounded px-1">results/evaluation.json</code> which this page reads.
        </p>
      </div>
    </div>
  );

  const m = result.metrics;
  const accuracy = result.classification_report?.accuracy;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Model Evaluation</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">
          Offline benchmark results from the test dataset
        </p>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-soc-text-secondary">
        {result.meta.timestamp && (
          <span>Evaluated: <span className="font-mono text-soc-text">{new Date(result.meta.timestamp).toLocaleString()}</span></span>
        )}
        <span>Test samples: <span className="font-mono text-soc-text">{result.meta.test_samples}</span></span>
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile label="Precision" value={`${(m.precision * 100).toFixed(1)}%`} sub="TP / (TP + FP)" />
        <MetricTile label="Recall" value={`${(m.recall * 100).toFixed(1)}%`} sub="TP / (TP + FN)" />
        <MetricTile label="F1 Score" value={`${(m.f1_score * 100).toFixed(1)}%`} sub="Harmonic mean" />
        <MetricTile label="Avg Latency" value={`${m.avg_latency_ms.toFixed(1)} ms`} sub="per flow" />
      </div>

      {/* Accuracy */}
      {accuracy != null && (
        <div className="bg-soc-card border border-soc-border rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-soc-text-secondary mb-1">Accuracy</div>
              <div className="text-2xl font-mono font-semibold text-soc-text">
                {(accuracy * 100).toFixed(2)}%
              </div>
            </div>
            <BarChart2 size={20} className="text-soc-text-muted" />
          </div>
          <div className="mt-3 h-1.5 bg-soc-border rounded-full overflow-hidden">
            <div className="h-full bg-soc-primary rounded-full" style={{ width: `${(accuracy * 100).toFixed(1)}%` }} />
          </div>
        </div>
      )}

      {/* Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: result.counts.total },
          { label: 'Normal Predicted', value: result.counts.normal_predicted },
          { label: 'Intrusion Predicted', value: result.counts.intrusion_predicted },
          { label: 'Rule Detections', value: result.counts.rule_detections },
          { label: 'ML Detections', value: result.counts.ml_detections },
        ].map(({ label, value }) => (
          <div key={label} className="bg-soc-card border border-soc-border rounded p-3">
            <div className="text-xs text-soc-text-secondary mb-1">{label}</div>
            <div className="font-mono text-lg text-soc-text">{value}</div>
          </div>
        ))}
      </div>

      {/* Confusion matrix */}
      {result.confusion_matrix && (
        <ConfusionMatrix
          matrix={result.confusion_matrix.matrix}
          labels={result.confusion_matrix.labels}
        />
      )}

      {/* Classification report */}
      {result.classification_report && (
        <div className="bg-soc-card border border-soc-border rounded p-4">
          <h2 className="text-sm font-semibold text-soc-text mb-3">Classification Report</h2>
          <pre className="text-xs font-mono text-soc-text-secondary whitespace-pre overflow-x-auto bg-soc-bg rounded border border-soc-border p-3">
            {JSON.stringify(result.classification_report, null, 2)}
          </pre>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-soc-card border border-soc-border rounded p-4 text-xs text-soc-text-muted">
        <AlertTriangle size={12} className="inline mr-1.5 text-soc-warning" />
        {result.meta.disclaimer}
      </div>
    </div>
  );
}
