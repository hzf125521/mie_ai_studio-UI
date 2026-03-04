import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface FeatureImportanceChartProps {
  features: string[];
  importance: number[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ features, importance }) => {
  const data = features.map((f, i) => ({
    name: f,
    value: importance[i] || 0
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="h-64 w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Feature Importance (MDI)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={100} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            itemStyle={{ color: '#374151' }}
          />
          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(260, 70%, ${50 + index * 5}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
