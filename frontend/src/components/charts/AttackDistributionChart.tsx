// components/charts/AttackDistributionChart.tsx — Horizontal bar chart of attack categories.

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Statistics } from '../../types';

interface Props {
  stats: Statistics;
}

// Semantic colors: consistent and restrained
const ATTACK_COLORS: Record<string, string> = {
  DOS: '#f85149',               // Red
  DATA_EXFILTRATION: '#cf222e', // Deep red
  PORT_SCAN: '#d29922',         // Amber
  DATA_THEFT: '#f0883e',        // Orange
  ML_ANOMALY: '#58a6ff',        // Blue
};

const AttackDistributionChart: React.FC<Props> = ({ stats }) => {
  const data = stats.attack_distribution ?? {};

  const chartData = Object.entries(data)
    .filter(([, val]) => val > 0)
    .map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      rawKey: name,
      count: value,
    }))
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return (
      <div className="bg-soc-card border border-soc-border rounded p-4">
        <h3 className="text-sm font-semibold text-soc-text mb-3">Attack Distribution</h3>
        <div className="h-32 flex items-center justify-center text-xs text-soc-text-muted border border-dashed border-soc-border rounded">
          No attack data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soc-card border border-soc-border rounded p-4">
      <h3 className="text-sm font-semibold text-soc-text mb-3">Attack Distribution</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 25, bottom: 5, left: 90 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--soc-border)" opacity={0.5} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--soc-text-secondary)', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: 'var(--soc-border)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--soc-text-secondary)', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              width={85}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--soc-card)',
                borderColor: 'var(--soc-border)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'var(--soc-text)',
              }}
              formatter={(value: any) => [`${value} detections`, 'Count']}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ATTACK_COLORS[entry.rawKey] || '#8b949e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttackDistributionChart;
