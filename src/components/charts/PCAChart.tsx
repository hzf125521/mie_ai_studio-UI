import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';

interface PCAChartProps {
  data: any[];
}

export const PCAChart: React.FC<PCAChartProps> = ({ data }) => {
  const [dimension, setDimension] = useState<'2D' | '3D'>('2D');

  // Ensure data has x, y, z
  const pcaData = data.map((d, i) => ({
    ...d,
    x: d.x !== undefined ? d.x : (d.value1 || 0) * 2 + Math.random(),
    y: d.y !== undefined ? d.y : (d.value2 || 0) * 2 + Math.random(),
    z: d.z !== undefined ? d.z : (d.value1 || 0) - (d.value2 || 0) + Math.random(),
    type: d.type || (i % 10 === 0 ? 'Anomaly' : 'Normal'),
  }));

  return (
    <div className="h-full w-full bg-white rounded-lg p-4 relative">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" dataKey="x" name="PC1" stroke="#9ca3af" fontSize={12} />
          <YAxis type="number" dataKey="y" name="PC2" stroke="#9ca3af" fontSize={12} />
          {dimension === '3D' && <ZAxis type="number" dataKey="z" name="PC3" range={[0, 500]} />}
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-xs">
                    <p className="font-semibold">Time: {data.time}</p>
                    <p>PC1: {data.x.toFixed(2)}</p>
                    <p>PC2: {data.y.toFixed(2)}</p>
                    <p>Type: {data.type}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Normal" data={pcaData.filter(d => d.type === 'Normal')} fill="#10b981" shape="circle" />
          <Scatter name="Anomaly" data={pcaData.filter(d => d.type === 'Anomaly')} fill="#ef4444" shape="cross" />
          <Scatter name="Data" data={pcaData.filter(d => d.type === 'Data')} fill="#6366f1" shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
