import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Play,
  Download,
  RefreshCw,
  Layers,
  BarChart2,
  Table,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  DatasetValidationResult,
  CustomDatasetEvaluationResult
} from '../types';
import { LoadingState } from '../components/common/LoadingState';

export default function DatasetPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validation, setValidation] = useState<DatasetValidationResult | null>(null);
  const [evaluation, setEvaluation] = useState<CustomDatasetEvaluationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [training, setTraining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileChange = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      addToast('error', 'Invalid File Type', 'Please upload a valid .csv dataset file.');
      return;
    }
    setSelectedFile(file);
    setEvaluation(null);
    setValidating(true);

    try {
      const res = await api.validateDataset(file);
      setValidation(res);
      addToast('success', 'Dataset Validated', `Loaded ${res.total_rows} flow records.`);
    } catch (e: any) {
      addToast('error', 'Validation Failed', e.message ?? 'Failed to parse CSV dataset.');
      setValidation(null);
    } finally {
      setValidating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedFile) return;
    setEvaluating(true);
    try {
      const res = await api.evaluateDataset(selectedFile);
      setEvaluation(res);
      addToast('success', 'Batch Evaluation Complete', `Analyzed ${res.counts.total} flows.`);
    } catch (e: any) {
      addToast('error', 'Evaluation Error', e.message ?? 'Failed to evaluate dataset.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleRetrainOnDataset = async () => {
    if (!selectedFile) return;
    setTraining(true);
    try {
      const res = await api.trainCustomDataset(selectedFile);
      addToast('success', 'Model Retrained', res.message);
    } catch (e: any) {
      addToast('error', 'Retraining Failed', e.message ?? 'Failed to retrain Random Forest.');
    } finally {
      setTraining(false);
    }
  };

  const handleExportCSV = () => {
    if (!evaluation || !evaluation.predictions) return;

    const headers = ['ID', 'Duration', 'Src Bytes', 'Dst Bytes', 'Status', 'Method', 'Attack Type', 'Severity', 'Latency (ms)'];
    if (evaluation.meta.has_ground_truth) {
      headers.push('Ground Truth', 'Correct');
    }

    const rows = evaluation.predictions.map(p => {
      const row = [
        p.id,
        p.duration,
        p.src_bytes,
        p.dst_bytes,
        p.status,
        p.detection_method,
        p.attack_type ?? 'NONE',
        p.severity,
        p.latency_ms
      ];
      if (evaluation.meta.has_ground_truth) {
        row.push(p.ground_truth ?? '', p.correct ? 'YES' : 'NO');
      }
      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `classified_${selectedFile?.name ?? 'dataset'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('info', 'Export Started', 'Classified dataset downloaded as CSV.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-soc-text">Dataset Studio</h1>
        <p className="text-sm text-soc-text-secondary mt-0.5">
          Upload custom CSV network flow datasets, evaluate detection pipelines, analyze metrics, and retrain models.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-soc-primary bg-soc-primary/10'
            : 'border-soc-border bg-soc-card hover:bg-soc-card-hover'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        />
        <Upload className="w-8 h-8 text-soc-primary mx-auto mb-2 opacity-80" />
        <div className="text-sm font-medium text-soc-text">
          {selectedFile ? selectedFile.name : 'Drag and drop your network dataset (.csv)'}
        </div>
        <p className="text-xs text-soc-text-muted mt-1">
          Requires columns: <code className="font-mono bg-soc-border rounded px-1">duration</code>,{' '}
          <code className="font-mono bg-soc-border rounded px-1">src_bytes</code>,{' '}
          <code className="font-mono bg-soc-border rounded px-1">dst_bytes</code> (Optional:{' '}
          <code className="font-mono bg-soc-border rounded px-1">label</code> for ground truth)
        </p>
      </div>

      {validating && <LoadingState message="Parsing and validating CSV schema..." />}

      {/* Validation Card */}
      {validation && !validating && (
        <div className="bg-soc-card border border-soc-border rounded p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-soc-border pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-soc-primary" />
              <div>
                <h2 className="text-sm font-semibold text-soc-text">{selectedFile?.name}</h2>
                <div className="text-xs text-soc-text-secondary mt-0.5">
                  {validation.total_rows} rows · {validation.columns.length} columns · Ground Truth Labels:{' '}
                  <span className={validation.has_labels ? 'text-soc-success font-semibold' : 'text-soc-text-muted'}>
                    {validation.has_labels ? 'Present' : 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRunEvaluation}
                disabled={evaluating || validation.status === 'invalid'}
                className="flex items-center gap-2 px-4 py-2 bg-soc-primary text-white text-xs font-semibold rounded hover:bg-soc-primary-hover disabled:opacity-50 transition-colors"
              >
                <Play className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
                {evaluating ? 'Evaluating Pipeline...' : 'Evaluate Network Dataset'}
              </button>

              <button
                onClick={handleRetrainOnDataset}
                disabled={training}
                className="flex items-center gap-2 px-3 py-2 border border-soc-border bg-soc-bg text-soc-text-secondary hover:text-soc-text text-xs font-medium rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
                {training ? 'Retraining...' : 'Retrain Random Forest'}
              </button>
            </div>
          </div>

          {/* Validation Feature Check Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {['duration', 'src_bytes', 'dst_bytes'].map((col) => {
              const exists = validation.columns.includes(col);
              return (
                <div
                  key={col}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono ${
                    exists
                      ? 'bg-soc-success/10 border-soc-success/30 text-soc-success'
                      : 'bg-soc-critical/10 border-soc-critical/30 text-soc-critical'
                  }`}
                >
                  {exists ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {col}
                </div>
              );
            })}
          </div>

          {/* Sample Rows Preview Table */}
          {validation.sample_rows.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-soc-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" /> Sample Preview (First 10 Rows)
              </div>
              <div className="overflow-x-auto border border-soc-border rounded">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-soc-bg border-b border-soc-border">
                      {validation.columns.map((col) => (
                        <th key={col} className="text-left px-3 py-2 font-medium text-soc-text-secondary">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validation.sample_rows.map((row, i) => (
                      <tr key={i} className="border-b border-soc-border-subtle hover:bg-soc-card-hover">
                        {validation.columns.map((col) => (
                          <td key={col} className="px-3 py-1.5 text-soc-text">
                            {row[col] !== null ? String(row[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {evaluating && <LoadingState message="Processing network flows through Rule Engine and Random Forest..." />}

      {/* Batch Evaluation Results Dashboard */}
      {evaluation && !evaluating && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-soc-text">Evaluation Results & Benchmark</h2>
              <p className="text-xs text-soc-text-secondary mt-0.5">
                Processed {evaluation.counts.total} flows · {evaluation.counts.rule_detections} Rule detections ·{' '}
                {evaluation.counts.ml_detections} ML anomaly detections
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 border border-soc-border bg-soc-card text-soc-text text-xs font-medium rounded hover:bg-soc-card-hover transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-soc-primary" /> Export Classified CSV
            </button>
          </div>

          {/* Metric Cards (If Ground Truth Available) */}
          {evaluation.metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Precision', value: `${(evaluation.metrics.precision * 100).toFixed(1)}%`, sub: 'TP / (TP + FP)' },
                { label: 'Recall', value: `${(evaluation.metrics.recall * 100).toFixed(1)}%`, sub: 'TP / (TP + FN)' },
                { label: 'F1 Score', value: `${(evaluation.metrics.f1_score * 100).toFixed(1)}%`, sub: 'Harmonic mean' },
                { label: 'Accuracy', value: `${(evaluation.metrics.accuracy * 100).toFixed(1)}%`, sub: `Over ${evaluation.counts.total} samples` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-soc-card border border-soc-border rounded p-4">
                  <div className="text-xs text-soc-text-secondary mb-2">{label}</div>
                  <div className="text-2xl font-mono font-semibold text-soc-primary">{value}</div>
                  <div className="text-xs text-soc-text-muted mt-1">{sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Confusion Matrix & Attack Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Confusion Matrix */}
            {evaluation.confusion_matrix && (
              <div className="bg-soc-card border border-soc-border rounded p-4">
                <h3 className="text-sm font-semibold text-soc-text mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-soc-primary" /> Confusion Matrix
                </h3>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  {[
                    { label: 'TP', val: evaluation.confusion_matrix.matrix[1]?.[1] ?? 0, desc: 'True Positive', bg: 'bg-soc-success/10 text-soc-success border-soc-success/30' },
                    { label: 'FP', val: evaluation.confusion_matrix.matrix[0]?.[1] ?? 0, desc: 'False Positive', bg: 'bg-soc-warning/10 text-soc-warning border-soc-warning/30' },
                    { label: 'FN', val: evaluation.confusion_matrix.matrix[1]?.[0] ?? 0, desc: 'False Negative', bg: 'bg-soc-critical/10 text-soc-critical border-soc-critical/30' },
                    { label: 'TN', val: evaluation.confusion_matrix.matrix[0]?.[0] ?? 0, desc: 'True Negative', bg: 'bg-soc-primary/10 text-soc-primary border-soc-primary/30' },
                  ].map(({ label, val, desc, bg }) => (
                    <div key={label} className={`border rounded p-3 text-center ${bg}`}>
                      <div className="text-xl font-mono font-semibold">{val}</div>
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-[10px] opacity-70">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attack Distribution Summary */}
            <div className="bg-soc-card border border-soc-border rounded p-4">
              <h3 className="text-sm font-semibold text-soc-text mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-soc-warning" /> Attack Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(evaluation.attack_distribution).length === 0 ? (
                  <div className="text-xs text-soc-text-muted py-6 text-center">No attack vectors identified</div>
                ) : (
                  Object.entries(evaluation.attack_distribution).map(([type, count]) => {
                    const pct = evaluation.counts.intrusion_predicted > 0
                      ? Math.round((count / evaluation.counts.intrusion_predicted) * 100)
                      : 0;
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-xs font-mono text-soc-text-secondary mb-1">
                          <span>{type}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-soc-border rounded-full overflow-hidden">
                          <div className="h-full bg-soc-critical rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="bg-soc-card border border-soc-border rounded">
            <div className="px-4 py-3 border-b border-soc-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-soc-text">Classified Flow Predictions</h3>
              <span className="text-xs text-soc-text-muted">Showing {evaluation.predictions.length} flows</span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-soc-card border-b border-soc-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">#</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Duration</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Src Bytes</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Dst Bytes</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Method</th>
                    <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Attack Type</th>
                    {evaluation.meta.has_ground_truth && (
                      <th className="text-left px-4 py-2 font-medium text-soc-text-secondary">Ground Truth</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {evaluation.predictions.map((p) => (
                    <tr key={p.id} className="border-b border-soc-border-subtle hover:bg-soc-card-hover">
                      <td className="px-4 py-2 text-soc-text-muted">{p.id}</td>
                      <td className="px-4 py-2 text-soc-text">{p.duration}s</td>
                      <td className="px-4 py-2 text-soc-text">{p.src_bytes} B</td>
                      <td className="px-4 py-2 text-soc-text">{p.dst_bytes} B</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.status === 'INTRUSION'
                              ? 'bg-soc-critical/10 text-soc-critical border border-soc-critical/30'
                              : 'bg-soc-success/10 text-soc-success border border-soc-success/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-soc-text-secondary">{p.detection_method}</td>
                      <td className="px-4 py-2">
                        {p.attack_type ? (
                          <span className="text-soc-warning">{p.attack_type}</span>
                        ) : (
                          <span className="text-soc-text-muted">—</span>
                        )}
                      </td>
                      {evaluation.meta.has_ground_truth && (
                        <td className="px-4 py-2">
                          <span
                            className={`font-semibold ${
                              p.correct ? 'text-soc-success' : 'text-soc-critical'
                            }`}
                          >
                            {p.ground_truth} {p.correct ? '✓' : '✗'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
