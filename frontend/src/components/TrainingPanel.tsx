// components/TrainingPanel.tsx — Model training control panel.

import React, { useState } from 'react';
import { api } from '../services/api';
import type { TrainingResult } from '../types';

const TrainingPanel: React.FC = () => {
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrain = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.train();
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-nids-surface border border-nids-border rounded p-4">
      <h2 className="text-sm font-semibold text-nids-muted uppercase tracking-wider mb-3">
        Model Control
      </h2>
      <p className="text-xs text-nids-muted mb-3">
        Train the Random Forest on <code className="mono text-nids-blue">sample_data.csv</code>.
        Run <code className="mono text-nids-blue">generate_dataset.py</code> first.
      </p>

      <button
        onClick={handleTrain}
        disabled={loading}
        className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded px-4 py-2 transition-colors"
      >
        {loading ? 'Training…' : 'Train Model (POST /api/train)'}
      </button>

      {error && (
        <div className="mt-3 text-xs text-nids-red bg-red-950/30 border border-red-900/40 rounded px-3 py-2">
          ✗ {error}
        </div>
      )}

      {result && (
        <div className="mt-3 text-xs border border-emerald-800/40 bg-emerald-950/20 rounded p-3">
          <div className="text-nids-green font-semibold mb-2">✓ Training complete</div>
          <div className="grid grid-cols-2 gap-y-1 text-nids-muted">
            <span>Samples:</span><span className="mono text-nids-text">{result.samples_trained}</span>
            <span>Features:</span><span className="mono text-nids-text">{result.features.join(', ')}</span>
            <span>Contamination:</span><span className="mono text-nids-text">{result.contamination}</span>
            <span>Trees:</span><span className="mono text-nids-text">{result.n_estimators}</span>
            <span>Time:</span><span className="mono text-nids-text">{result.training_time_s.toFixed(2)}s</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default TrainingPanel;
