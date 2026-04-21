import React, { useMemo, useState } from 'react';
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
import { ChevronDown } from 'lucide-react';

interface TimeSeriesChartProps {
  data: any[];
  features: string[];
  targetFeature?: string;
  title?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, features, targetFeature, title }) => {
  const [visibleFeatures, setVisibleFeatures] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    features.forEach(f => initial[f] = true);
    if (targetFeature) initial[targetFeature] = true;
    return initial;
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mode, setMode] = useState<'raw' | 'normalized'>('raw');

  const toggleFeature = (feature: string) => {
    setVisibleFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const allFeatures = [...features, ...(targetFeature ? [targetFeature] : [])];

  const normalizedData = useMemo(() => {
    if (!data.length) return data;

    const ranges: Record<string, { min: number; max: number }> = {};
    allFeatures.forEach((feature) => {
      const values = data
        .map((d) => Number(d[feature]))
        .filter((v) => Number.isFinite(v));
      if (!values.length) {
        ranges[feature] = { min: 0, max: 0 };
        return;
      }
      ranges[feature] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return data.map((d) => {
      const next = { ...d };
      allFeatures.forEach((feature) => {
        const raw = Number(d[feature]);
        if (!Number.isFinite(raw)) {
          next[feature] = 0;
          return;
        }
        const { min, max } = ranges[feature];
        next[feature] = max === min ? 0 : (raw - min) / (max - min);
      });
      return next;
    });
  }, [data, allFeatures]);

  const chartData = mode === 'normalized' ? normalizedData : data;

  return (
    <div className="h-64 w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200 relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">
          {title || 'Multi-Feature Time Domain'} {mode === 'normalized' ? '(Min-Max)' : '(Raw)'}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center text-xs bg-white/90 p-1 rounded border border-gray-200">
            <button
              onClick={() => setMode('raw')}
              className={`px-2 py-1 rounded ${mode === 'raw' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Raw
            </button>
            <button
              onClick={() => setMode('normalized')}
              className={`px-2 py-1 rounded ${mode === 'normalized' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Min-Max
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200"
            >
              Select Features <ChevronDown className="w-3 h-3" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-20 py-1">
                {allFeatures.map(feature => (
                  <label key={feature} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={visibleFeatures[feature]}
                      onChange={() => toggleFeature(feature)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                    />
                    <span className="truncate">{feature} {feature === targetFeature ? '(Target)' : ''}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            itemStyle={{ color: '#374151' }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend />
          {features.map((feature, index) => visibleFeatures[feature] && (
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
          {targetFeature && visibleFeatures[targetFeature] && (
             <Line
              key={targetFeature}
              type="monotone"
              dataKey={targetFeature}
              stroke="#000000"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name={`${targetFeature} (Target)`}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
