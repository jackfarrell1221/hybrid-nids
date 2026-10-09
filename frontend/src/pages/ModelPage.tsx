import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Brain } from 'lucide-react';
import { api } from '../services/api';
import { ModelInfo } from '../types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export default function ModelPage() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<string | null>(null);
  const [trainError, setTrainError] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.modelInfo();
      setInfo(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load model info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTrain = async () => {
    setTraining(true);
    setTrainResult(null);
    setTrainError(false);
    try {
      const res = await api.train();
      setTrainResult(res.message ?? `Training complete. ${res.samples_trained} samples, ${res.training_time_s?.toFixed(2)}s`);
      setTrainError(false);
      await load();
    } catch (e: any) {
      setTrainResult(`Error: ${e.message}`);
      setTrainError(true);
    } finally {
      setTraining(false);
    }
  };

  if (loading) return <LoadingState message="Loading model information..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const sizeKb = info?.file_info ? (info.file_info.size_bytes / 1024).toFixed(1) : null;
  const lastMod = info?.file_info?.last_modified ? new Date(info.file_info.last_modified).toLocaleString() : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-soc-text">ML Model</h1>
          <p className="text-sm text-soc-text-secondary mt-0.5">
            Random Forest configuration and retraining
          </p>
        </div>
        <button
          onClick={handleTrain}
          disabled={training}
          className="flex items-center gap-2 px-4 py-2 bg-soc-primary text-white text-sm font-medium rounded hover:bg-soc-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={14} className={training ? 'animate-spin' : ''} />
          {training ? 'Training...' : 'Retrain Model'}
        </button>
      </div>

      {trainResult && (
        <div className={`rounded border px-4 py-3 text-sm ${
          trainError
            ? 'bg-soc-critical/10 border-soc-critical/30 text-soc-critical'
            : 'bg-soc-success/10 border-soc-success/30 text-soc-success'
        }`}>
          {trainResult}
        </div>
      )}

      {/* Model status card */}
      <div className="bg-soc-card border border-soc-border rounded p-4 flex items-center gap-4">
        <div className="p-2 bg-soc-primary/10 rounded border border-soc-primary/30">
          <Brain size={20} className="text-soc-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-soc-text">
            {info?.model_name ?? 'Random Forest'}
          </div>
          <div className="text-xs text-soc-text-secondary mt-0.5">
            {info?.algorithm}
          </div>
          <div className="text-xs mt-1">
            Status:{' '}
            <span className={info?.loaded ? 'text-soc-success' : 'text-soc-critical'}>
              {info?.loaded ? 'loaded' : 'not loaded'}
            </span>
            {' '}·{' '}
            File:{' '}
            <span className={info?.file_exists ? 'text-soc-success' : 'text-soc-critical'}>
              {info?.file_exists ? 'exists' : 'missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Config params */}
      <div className="bg-soc-card border border-soc-border rounded">
        <div className="px-4 py-3 border-b border-soc-border">
          <h2 className="text-sm font-semibold text-soc-text">Model Configuration</h2>
        </div>
        <div className="divide-y divide-soc-border-subtle">
          {[
            { label: 'Contamination', value: info?.contamination },
            { label: 'N Estimators', value: info?.n_estimators },
            { label: 'Random State', value: info?.random_state },
            { label: 'Features', value: info?.features?.join(', ') },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-soc-text-secondary">{label}</span>
              <span className="font-mono text-sm text-soc-text">{String(value ?? '—')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* File metadata */}
      <div className="bg-soc-card border border-soc-border rounded">
        <div className="px-4 py-3 border-b border-soc-border">
          <h2 className="text-sm font-semibold text-soc-text">Model File</h2>
        </div>
        <div className="divide-y divide-soc-border-subtle">
          {[
            { label: 'Path', value: info?.model_path },
            { label: 'Size', value: sizeKb != null ? `${sizeKb} KB` : '—' },
            { label: 'Last Modified', value: lastMod ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-soc-text-secondary">{label}</span>
              <span className="font-mono text-xs text-soc-text break-all max-w-xs text-right">{String(value ?? '—')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Explainability note */}
      <div className="bg-soc-card border border-soc-border rounded p-4 text-xs text-soc-text-secondary space-y-2">
        <h3 className="text-sm font-semibold text-soc-text">How Random Forest Works</h3>
        <p>
          Random Forest is an unsupervised anomaly detection algorithm. It isolates observations by
          randomly selecting a feature and a split value. Anomalies — rare and different points — are isolated
          in fewer steps than normal observations.
        </p>
        <p>
          Flows with an anomaly score above the contamination threshold (<span className="font-mono">{info?.contamination ?? '0.05'}</span>) are
          classified as <span className="font-mono text-soc-critical">ML_ANOMALY</span> intrusions.
        </p>
        <p className="text-soc-text-muted">
          The model is trained on <code className="font-mono bg-soc-border rounded px-1">data/sample_data.csv</code>.
          Retrain when new normal traffic patterns emerge.
        </p>
      </div>
    </div>
  );
}
