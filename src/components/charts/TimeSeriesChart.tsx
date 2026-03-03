import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TimeSeriesChartProps {
  data: any[];
  features: string[];
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, features }) => {
  return (
    <div className="h-64 w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Multi-Feature Time Domain</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            itemStyle={{ color: '#374151' }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend />
          {features.map((feature, index) => (
            <Line
              key={feature}
              type="monotone"
              dataKey={feature}
              stroke={`hsl(${index * 60}, 70%, 50%)`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
