import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChevronDown, Info } from 'lucide-react';

interface AnomalyChartProps {
  data: any[];
  threshold: number;
}

const formatTimestamp = (timestamp: number | string | Date): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${month}-${day} ${HH}:${mm}:${ss}`;
};

const LEGEND_ITEMS = [
  { key: 'anomalyScore', label: '样本异常分数', color: '#8884d8', lineStyle: '实线', strokeDasharray: '' },
  { key: 'threshold', label: '阈值', color: '#ef4444', lineStyle: '虚线', strokeDasharray: '3 3' },
];

export const AnomalyChart: React.FC<AnomalyChartProps> = ({ data, threshold }) => {
  const [visibleLegends, setVisibleLegends] = useState<Set<string>>(new Set(['anomalyScore', 'threshold']));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLegend = (key: string) => {
    setVisibleLegends(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const showAnomalyScore = visibleLegends.has('anomalyScore');
  const showThreshold = visibleLegends.has('threshold');

  return (
    <div className="h-full w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative flex flex-col overflow-visible">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-gray-500">样本异常分数</h3>
          <div
            className="relative"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <Info className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 cursor-help" />
            {showInfo && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
                <p>用于表示特征样本的异常程度，值在0~1范围，越接近于1，则表示越异常。</p>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 transition-colors"
          >
            <span>图例选择</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
              {LEGEND_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => toggleLegend(item.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 w-8 flex-shrink-0">
                    <svg width="24" height="12" className="flex-shrink-0">
                      <line
                        x1="0" y1="6" x2="24" y2="6"
                        stroke={item.color}
                        strokeWidth="2"
                        strokeDasharray={item.strokeDasharray}
                      />
                    </svg>
                  </div>
                  <span className={visibleLegends.has(item.key) ? 'text-gray-700' : 'text-gray-400'}>
                    {item.label}
                  </span>
                  <span className={`ml-auto w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                    visibleLegends.has(item.key)
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-gray-300'
                  }`}>
                    {visibleLegends.has(item.key) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={(value) => formatTimestamp(value)}
              label={{ value: '时间', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              label={{ value: '分数', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white/50 backdrop-blur-sm border border-gray-200 shadow-xl rounded-lg p-3 min-w-[160px]">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium border-b border-gray-100 pb-1.5">
                      {label != null ? formatTimestamp(label) : ''}
                    </p>
                    <div className="space-y-1.5">
                      {showAnomalyScore && payload.find((p: any) => p.dataKey === 'anomalyScore') && (
                        <div className="flex items-center gap-2">
                          <svg width="20" height="8" className="flex-shrink-0">
                            <line x1="0" y1="4" x2="20" y2="4" stroke="#8884d8" strokeWidth="2" />
                          </svg>
                          <span className="text-xs text-gray-500">样本异常分数</span>
                          <span className="text-xs font-medium text-gray-800 ml-auto">
                            {payload.find((p: any) => p.dataKey === 'anomalyScore')?.value?.toFixed(4) ?? '-'}
                          </span>
                        </div>
                      )}
                      {showThreshold && (
                        <div className="flex items-center gap-2">
                          <svg width="20" height="8" className="flex-shrink-0">
                            <line x1="0" y1="4" x2="20" y2="4" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                          </svg>
                          <span className="text-xs text-gray-500">阈值</span>
                          <span className="text-xs font-medium text-gray-800 ml-auto">
                            {threshold.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            {showThreshold && (
              <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
            )}
            {showAnomalyScore && (
              <Line
                type="monotone"
                dataKey="anomalyScore"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
