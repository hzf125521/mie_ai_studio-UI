import React, { useState } from 'react';
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

  const toggleFeature = (feature: string) => {
    setVisibleFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const allFeatures = [...features, ...(targetFeature ? [targetFeature] : [])];

  return (
    <div className="h-64 w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200 relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title || 'Multi-Feature Time Domain'}</h3>
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
