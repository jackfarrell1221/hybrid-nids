// components/AnalyticsCharts.tsx — Recharts visualisations for detection metrics.

import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { Statistics } from '../types';

interface Props {
  stats: Statistics;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

const AnalyticsCharts: React.FC<Props> = ({ stats }) => {
  // Chart 1: Normal vs Intrusion
  const trafficData = [
    { name: 'Normal',    value: stats.normal_flows },
    { name: 'Intrusion', value: stats.intrusion_flows },
  ];

  // Chart 2: Rule vs ML
  const methodData = [
    { name: 'Rule',  value: stats.rule_detections },
    { name: 'ML',    value: stats.ml_detections },
  ];

  // Chart 3: Attack distribution
  const attackData = Object.entries(stats.attack_distribution).map(
    ([name, value]) => ({ name, value }),
  );

  return (
    <section className="bg-nids-surface border border-nids-border rounded p-4">
      <h2 className="text-sm font-semibold text-nids-muted uppercase tracking-wider mb-4">
        Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 1 — Traffic Split */}
        <div>
          <h3 className="text-xs text-nids-muted mb-2 uppercase tracking-wide">
            Normal vs Intrusion
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={trafficData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {trafficData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 4 }}
                labelStyle={{ color: '#e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 — Detection Method */}
        <div>
          <h3 className="text-xs text-nids-muted mb-2 uppercase tracking-wide">
            Rule vs ML Detections
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={methodData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 4 }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3 — Attack Distribution */}
        <div>
          <h3 className="text-xs text-nids-muted mb-2 uppercase tracking-wide">
            Attack Type Distribution
          </h3>
          {attackData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-xs text-nids-muted">
              No intrusions recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={attackData}
                layout="vertical"
                margin={{ top: 5, right: 5, bottom: 5, left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 4 }}
                />
                <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                  {attackData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stats summary row */}
      <div className="mt-4 pt-4 border-t border-nids-border grid grid-cols-4 gap-4 text-center text-xs">
        <div>
          <div className="text-nids-muted">Detection Rate</div>
          <div className="text-nids-text mono font-semibold">
            {stats.detection_percentage.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-nids-muted">Avg Latency</div>
          <div className="text-nids-text mono font-semibold">
            {stats.avg_latency_ms.toFixed(2)} ms
          </div>
        </div>
        <div>
          <div className="text-nids-muted">Rule : ML</div>
          <div className="text-nids-text mono font-semibold">
            {stats.rule_detections} : {stats.ml_detections}
          </div>
        </div>
        <div>
          <div className="text-nids-muted">Total Flows</div>
          <div className="text-nids-text mono font-semibold">{stats.total_flows}</div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsCharts;
