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
  Area,
  ComposedChart,
  Scatter
} from 'recharts';

interface TrueVsPredChartProps {
  data: any[];
  targetName: string;
}

export const TrueVsPredChart: React.FC<TrueVsPredChartProps> = ({ data, targetName }) => {
  // data should contain: time, trueValue, predValue, upper, lower, isAlarm
  // transform data if necessary or assume passed data has these fields
  
  // Since we mock data in Step2, we'll assume the model object prepares this data
  // or we calculate it here.
  // Ideally Step2 prepares the data.
  
  return (
    <div className="h-64 w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">True vs Predicted {targetName}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            itemStyle={{ color: '#374151' }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend />
          
          {/* Threshold Area */}
          <Area 
            type="monotone" 
            dataKey="range" 
            fill="#e0e7ff" 
            stroke="none" 
            fillOpacity={0.5} 
          />
           {/* We can't easily do range area with single dataKey in Recharts unless we use [min, max] for dataKey which Area supports */}
           {/* Let's use two lines for threshold or Area with [lower, upper] */}
           
          <Area
            type="monotone"
            dataKey="confidence" // Expecting [lower, upper] array
            stroke="#818cf8"
            fill="#c7d2fe"
            fillOpacity={0.3}
            name="Threshold (3σ)"
          />

          <Line
            type="monotone"
            dataKey="trueValue"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.isAlarm) {
                return <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="none" />;
              }
              return null;
            }}
            activeDot={{ r: 6 }}
            name="True Value"
          />
          
          <Line
            type="monotone"
            dataKey="predValue"
            stroke="#10b981"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name="Predicted Value"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
