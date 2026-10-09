// components/simulation/SimulationConsole.tsx — Controlled local attack simulation environment.

import React, { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSimulation } from '../../context/SimulationContext';
import { SeverityBadge } from '../common/SeverityBadge';
import type { DetectionResult } from '../../types';
import { Play, Radio } from 'lucide-react';

interface Props {
  onSimulated?: () => void;
}

type ScenarioId = 'normal' | 'port_scan' | 'dos' | 'data_exfiltration' | 'data_theft' | 'full';

const SCENARIOS: { id: ScenarioId; label: string; desc: string; method: string }[] = [
  { id: 'normal',            label: 'Normal Traffic',     desc: 'Standard HTTP/HTTPS sessions',      method: 'Random Forest' },
  { id: 'port_scan',         label: 'Port Scan',          desc: 'Rapid sub-second probing < 100B',    method: 'PORT_SCAN Rule' },
  { id: 'dos',               label: 'DoS Flood',          desc: 'High packet volume asymmetry (>10x)',method: 'DOS Rule' },
  { id: 'data_exfiltration', label: 'Data Exfiltration',  desc: 'Outbound transfer > 10MB',           method: 'DATA_EXFILTRATION Rule' },
  { id: 'data_theft',        label: 'Data Theft',         desc: 'Bulk client download spike (>10x)',  method: 'DATA_THEFT Rule' },
  { id: 'full',              label: 'Run Full Scenario',  desc: 'Interleaved normal + all attack profiles', method: 'Hybrid Full Suite' },
];

export const SimulationConsole: React.FC<Props> = ({ onSimulated }) => {
  const { addToast } = useToast();
  const { setIsSimulating, setSimulationActive, setLastScenario } = useSimulation();

  const [activeScenario, setActiveScenario] = useState<ScenarioId | null>(null);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [pipelineStep, setPipelineStep] = useState<number>(0);

  const runSimulation = async (scenario: ScenarioId) => {
    setActiveScenario(scenario);
    setIsSimulating(true);
    setSimulationActive(true);
    setLastScenario(scenario);
    setPipelineStep(1); // Generating flow

    try {
      // Small simulated pipeline step transitions for visual feedback
      setTimeout(() => setPipelineStep(2), 150); // Feature extraction
      setTimeout(() => setPipelineStep(3), 300); // Rule evaluation
      setTimeout(() => setPipelineStep(4), 450); // ML evaluation

      const res = await api.simulate(scenario, scenario === 'full' ? 1 : 2);
      setPipelineStep(5); // Alert generated

      setResults(res.results);
      addToast(
        'info',
        `Simulation Executed: ${scenario.toUpperCase()}`,
        `Generated and evaluated ${res.count} synthetic flows`
      );
      onSimulated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      addToast('error', 'Simulation Error', msg);
    } finally {
      setIsSimulating(false);
      setActiveScenario(null);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded border border-soc-border bg-soc-card">
      {/* Simulation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border border-amber-300 dark:border-amber-900/60 bg-amber-500/10">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          <div>
            <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase font-mono tracking-wide">
              CONTROLLED LOCAL SIMULATION TESTBED
            </h4>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
              Flows are created in-memory and processed strictly via the local detection service. No external network packets are emitted.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-500/5">
          SAFE SANDBOX
        </span>
      </div>

      {/* Scenario Triggers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {SCENARIOS.map((s) => {
          return (
            <button
              key={s.id}
              onClick={() => runSimulation(s.id)}
              disabled={activeScenario !== null}
              className={`p-2.5 rounded border text-left flex flex-col justify-between transition-colors disabled:opacity-50 ${
                s.id === 'full'
                  ? 'border-soc-primary/60 bg-soc-primary/5 hover:bg-soc-primary/10'
                  : 'border-soc-border bg-soc-bg hover:bg-soc-card-hover'
              }`}
            >
              <div>
                <span className={`text-xs font-semibold block ${s.id === 'full' ? 'text-soc-primary' : 'text-soc-text'}`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-soc-text-muted mt-0.5 block leading-tight">
                  {s.desc}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-soc-border/60 flex items-center justify-between text-[10px] font-mono text-soc-text-secondary">
                <span>{s.method}</span>
                <Play className="w-3 h-3 text-soc-text-muted" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Execution Pipeline Visualizer */}
      {pipelineStep > 0 && (
        <div className="p-3 rounded border border-soc-border bg-soc-bg/40 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-soc-text-secondary mb-2">
            <span>PIPELINE EXECUTION STATUS</span>
            <span className="text-soc-primary">Step {pipelineStep} of 5</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
            <div className={`p-1.5 rounded border ${pipelineStep >= 1 ? 'border-soc-primary bg-soc-primary/10 text-soc-primary' : 'border-soc-border text-soc-text-muted'}`}>
              1. Gen Flow
            </div>
            <div className={`p-1.5 rounded border ${pipelineStep >= 2 ? 'border-soc-primary bg-soc-primary/10 text-soc-primary' : 'border-soc-border text-soc-text-muted'}`}>
              2. Features
            </div>
            <div className={`p-1.5 rounded border ${pipelineStep >= 3 ? 'border-soc-primary bg-soc-primary/10 text-soc-primary' : 'border-soc-border text-soc-text-muted'}`}>
              3. Rules
            </div>
            <div className={`p-1.5 rounded border ${pipelineStep >= 4 ? 'border-soc-primary bg-soc-primary/10 text-soc-primary' : 'border-soc-border text-soc-text-muted'}`}>
              4. Random Forest
            </div>
            <div className={`p-1.5 rounded border ${pipelineStep >= 5 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-soc-border text-soc-text-muted'}`}>
              5. Alert Logged
            </div>
          </div>
        </div>
      )}

      {/* Live Results Table */}
      {results.length > 0 && (
        <div className="border border-soc-border rounded overflow-hidden">
          <div className="px-3 py-2 bg-soc-bg border-b border-soc-border flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-soc-text">Recent Simulation Trace ({results.length} flows)</span>
            <span className="text-soc-text-muted">Updated in SQLite</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-soc-border bg-soc-bg/40 text-[11px] font-mono text-soc-text-secondary">
                  <th className="py-1.5 px-3">STATUS</th>
                  <th className="py-1.5 px-3">ATTACK TYPE</th>
                  <th className="py-1.5 px-3">DETECTION METHOD</th>
                  <th className="py-1.5 px-3">SEVERITY</th>
                  <th className="py-1.5 px-3 text-right">SRC BYTES</th>
                  <th className="py-1.5 px-3 text-right">DST BYTES</th>
                  <th className="py-1.5 px-3 text-right">LATENCY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soc-border/40 font-mono text-[11px]">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-soc-card-hover">
                    <td className="py-1.5 px-3 font-semibold">
                      <span className={r.status === 'INTRUSION' ? 'text-red-500' : 'text-emerald-500'}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-soc-text">{r.attack_type || 'LEGITIMATE'}</td>
                    <td className="py-1.5 px-3 text-soc-text-secondary">{r.detection_method}</td>
                    <td className="py-1.5 px-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="py-1.5 px-3 text-right">{r.src_bytes.toLocaleString()} B</td>
                    <td className="py-1.5 px-3 text-right">{r.dst_bytes.toLocaleString()} B</td>
                    <td className="py-1.5 px-3 text-right text-soc-text-muted">{r.latency_ms?.toFixed(1)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
