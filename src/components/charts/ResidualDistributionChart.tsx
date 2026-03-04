import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ResidualDistributionChartProps {
  data: any[]; // Array of residuals
}

export const ResidualDistributionChart: React.FC<ResidualDistributionChartProps> = ({ data }) => {
  // We need to bin the residuals to create a histogram
  // Simple binning logic
  const residuals = data.map(d => d.residual);
  const min = Math.min(...residuals);
  const max = Math.max(...residuals);
  const binCount = 20;
  const binSize = (max - min) / binCount || 1;
  
  const bins = Array.from({ length: binCount }, (_, i) => ({
    binStart: min + i * binSize,
    binEnd: min + (i + 1) * binSize,
    count: 0,
    name: `${(min + i * binSize).toFixed(2)} - ${(min + (i + 1) * binSize).toFixed(2)}`
  }));
  
  residuals.forEach(r => {
    const binIndex = Math.min(Math.floor((r - min) / binSize), binCount - 1);
    if (binIndex >= 0) bins[binIndex].count++;
  });

  return (
    <div className="h-64 w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Residual Probability Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tick={false} label={{ value: 'Residual', position: 'insideBottom', offset: -5 }} />
          <YAxis stroke="#9ca3af" fontSize={12} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            itemStyle={{ color: '#374151' }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
