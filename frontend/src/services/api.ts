// services/api.ts — Typed API client for NEXUS NIDS.

import type {
  FlowInput,
  DetectionResult,
  Alert,
  Statistics,
  TrainingResult,
  HealthStatus,
  Rule,
  SimulationResult,
  ModelInfo,
  SystemHealthInfo,
  EvaluationResult,
  DatasetValidationResult,
  CustomDatasetEvaluationResult,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function fetchJSON<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const resp = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });

  const json = await resp.json();

  if (!resp.ok) {
    throw new Error(
      json?.error ?? `HTTP ${resp.status} ${resp.statusText}`,
    );
  }

  return json as T;
}

export const api = {
  /** GET /api/health — check backend liveness */
  health(): Promise<HealthStatus> {
    return fetchJSON<HealthStatus>('/api/health');
  },

  /** POST /api/predict — classify a single network flow */
  predict(flow: FlowInput): Promise<DetectionResult> {
    return fetchJSON<DetectionResult>('/api/predict', {
      method: 'POST',
      body: JSON.stringify(flow),
    });
  },

  /** POST /api/train — trigger Random Forest training */
  train(): Promise<TrainingResult> {
    return fetchJSON<TrainingResult>('/api/train', { method: 'POST' });
  },

  /** POST /api/simulate — run an attack scenario */
  simulate(scenario: string, count = 1): Promise<SimulationResult> {
    return fetchJSON<SimulationResult>('/api/simulate', {
      method: 'POST',
      body: JSON.stringify({ scenario, count }),
    });
  },

  /** GET /api/alerts — fetch recent intrusion alerts */
  alerts(limit = 100): Promise<{ alerts: Alert[]; count: number }> {
    return fetchJSON(`/api/alerts?limit=${limit}`);
  },

  /** GET /api/statistics — aggregated detection metrics */
  statistics(): Promise<Statistics> {
    return fetchJSON<Statistics>('/api/statistics');
  },

  /** GET /api/rules — list all active detection rules */
  rules(): Promise<{ rules: Rule[] }> {
    return fetchJSON('/api/rules');
  },

  /** GET /api/model/info — model configuration and file stats */
  modelInfo(): Promise<ModelInfo> {
    return fetchJSON<ModelInfo>('/api/model/info');
  },

  /** GET /api/system/health — component health breakdown */
  systemHealth(): Promise<SystemHealthInfo> {
    return fetchJSON<SystemHealthInfo>('/api/system/health');
  },

  /** GET /api/evaluation — offline benchmark results */
  evaluation(): Promise<EvaluationResult> {
    return fetchJSON<EvaluationResult>('/api/evaluation');
  },

  /** POST /api/dataset/validate — check CSV schema and preview */
  validateDataset(file: File | string): Promise<DatasetValidationResult> {
    if (typeof file === 'string') {
      return fetchJSON<DatasetValidationResult>('/api/dataset/validate', {
        method: 'POST',
        body: JSON.stringify({ csv_text: file }),
      });
    }
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE_URL}/api/dataset/validate`, { method: 'POST', body: formData }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  },

  /** POST /api/dataset/evaluate — batch evaluate custom CSV dataset */
  evaluateDataset(file: File | string): Promise<CustomDatasetEvaluationResult> {
    if (typeof file === 'string') {
      return fetchJSON<CustomDatasetEvaluationResult>('/api/dataset/evaluate', {
        method: 'POST',
        body: JSON.stringify({ csv_text: file }),
      });
    }
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE_URL}/api/dataset/evaluate`, { method: 'POST', body: formData }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  },

  /** POST /api/dataset/train — retrain Random Forest on uploaded dataset */
  trainCustomDataset(file: File | string): Promise<{ status: string; message: string }> {
    if (typeof file === 'string') {
      return fetchJSON('/api/dataset/train', {
        method: 'POST',
        body: JSON.stringify({ csv_text: file }),
      });
    }
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE_URL}/api/dataset/train`, { method: 'POST', body: formData }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  },

  /** PUT /api/alerts/:id/triage — update alert triage status */
  updateAlertTriage(alertId: number, triageStatus: string): Promise<{ status: string }> {
    return fetchJSON<{ status: string }>(`/api/alerts/${alertId}/triage`, {
      method: 'PUT',
      body: JSON.stringify({ triage_status: triageStatus }),
    });
  },
};

