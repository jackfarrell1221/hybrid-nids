// components/charts/TrafficSplitChart.tsx — Normal vs Intrusion donut chart.

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Statistics } from '../../types';

interface Props {
  stats: Statistics;
}

const COLORS = ['#2ea043', '#f85149'];

const TrafficSplitChart: React.FC<Props> = ({ stats }) => {
  const normalCount = stats.normal_flows;
  const intrusionCount = stats.intrusion_flows;
  const total = normalCount + intrusionCount;

  if (total === 0) {
    return (
      <div className="bg-soc-card border border-soc-border rounded p-4">
        <h3 className="text-sm font-semibold text-soc-text mb-3">Traffic Split</h3>
        <div className="h-32 flex items-center justify-center text-xs text-soc-text-muted border border-dashed border-soc-border rounded">
          No traffic data yet
        </div>
      </div>
    );
  }

  const data = [
    { name: 'Normal', value: normalCount },
    { name: 'Intrusion', value: intrusionCount },
  ];

  return (
    <div className="bg-soc-card border border-soc-border rounded p-4">
      <h3 className="text-sm font-semibold text-soc-text mb-3">Traffic Split</h3>
      <div className="flex items-center gap-4">
        <div className="h-40 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="var(--soc-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--soc-card)',
                  borderColor: 'var(--soc-border)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'var(--soc-text)',
                }}
                formatter={(val: any, name: any) => [
                  `${val} flows (${((val / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-xs">
          {data.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-soc-text-secondary">{entry.name}</span>
              <span className="font-mono text-soc-text ml-1">{entry.value}</span>
              <span className="text-soc-text-muted">({((entry.value / total) * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrafficSplitChart;
