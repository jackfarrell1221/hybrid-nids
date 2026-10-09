// types/index.ts — Shared TypeScript types for NEXUS NIDS.

export type DetectionStatus = 'NORMAL' | 'INTRUSION' | 'UNKNOWN';
export type DetectionMethod = 'RULE' | 'RANDOM_FOREST';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export type PageId =
  | 'overview'
  | 'traffic'
  | 'alerts'
  | 'dataset'
  | 'rules'
  | 'analytics'
  | 'evaluation'
  | 'model'
  | 'health'
  | 'settings';

export interface FlowInput {
  duration: number;
  src_bytes: number;
  dst_bytes: number;
}

export interface DetectionResult {
  status: DetectionStatus;
  attack_type: string | null;
  detection_method: DetectionMethod;
  severity: Severity;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  timestamp: string;
  latency_ms: number;
  anomaly_score?: number;
  message: string;
  scenario?: string;
}

export interface Alert {
  id: number;
  timestamp: string;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  status: DetectionStatus;
  attack_type: string | null;
  detection_method: DetectionMethod;
  severity: Severity;
  anomaly_score: number | null;
  latency_ms: number | null;
  message: string;
  triage_status?: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE';
}

export interface DatasetValidationResult {
  status: 'valid' | 'invalid';
  total_rows: number;
  columns: string[];
  missing_features: string[];
  has_labels: boolean;
  sample_rows: Record<string, any>[];
}

export interface DatasetPredictionItem {
  id: number;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  status: DetectionStatus;
  detection_method: DetectionMethod;
  attack_type: string | null;
  severity: Severity;
  latency_ms: number;
  message: string;
  ground_truth?: string;
  correct?: boolean;
}

export interface CustomDatasetEvaluationResult {
  meta: {
    timestamp: string;
    total_samples: number;
    has_ground_truth: boolean;
  };
  metrics?: {
    precision: number;
    recall: number;
    f1_score: number;
    accuracy: number;
    avg_latency_ms: number;
  };
  confusion_matrix?: {
    labels: string[];
    matrix: number[][];
  };
  classification_report?: Record<string, any>;
  attack_distribution: Record<string, number>;
  counts: {
    total: number;
    normal_predicted: number;
    intrusion_predicted: number;
    rule_detections: number;
    ml_detections: number;
  };
  predictions: DatasetPredictionItem[];
}


export interface Statistics {
  total_flows: number;
  normal_flows: number;
  intrusion_flows: number;
  rule_detections: number;
  ml_detections: number;
  detection_percentage: number;
  avg_latency_ms: number;
  /** Map of attack_type → count (from alerts table) */
  attack_distribution: Record<string, number>;
}

export interface TrainingResult {
  status: string;
  message?: string;
  samples_trained: number;
  features: string[];
  contamination: number;
  n_estimators: number;
  model_path: string;
  training_time_s: number;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  message: string;
}

export interface Rule {
  id?: string;
  name: string;
  description: string;
  conditions?: string;
  thresholds?: Record<string, string>;
  attack_type?: string;
  severity: Severity;
  priority?: number;
}

export interface SimulationResult {
  scenario: string;
  count: number;
  results: DetectionResult[];
}

/** Returned by GET /api/model/info */
export interface ModelInfo {
  model_name: string;
  algorithm: string;
  loaded: boolean;
  features: string[];
  contamination: number;
  n_estimators: number;
  random_state: number;
  model_path: string;
  file_exists: boolean;
  file_info?: {
    size_bytes: number;
    last_modified: string;
  };
}

/** Returned by GET /api/system/health */
export interface SystemHealthInfo {
  status: string;
  timestamp: string;
  components: {
    api: { status: string; name: string };
    rule_engine: { status: string; active_rules: number };
    ml_detector: { status: string; ready: boolean; model_exists: boolean };
    database: { status: string; connected: boolean; type: string };
  };
}

/** Returned by GET /api/evaluation — reads results/evaluation.json */
export interface EvaluationResult {
  meta: {
    timestamp: string;
    test_samples: number;
    disclaimer: string;
  };
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    avg_latency_ms: number;
  };
  confusion_matrix: {
    labels: string[];
    /** 2x2 matrix: rows=actual (NORMAL, INTRUSION), cols=predicted */
    matrix: number[][];
  };
  classification_report: Record<string, any>;
  counts: {
    total: number;
    normal_predicted: number;
    intrusion_predicted: number;
    rule_detections: number;
    ml_detections: number;
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  timestamp: number;
}
