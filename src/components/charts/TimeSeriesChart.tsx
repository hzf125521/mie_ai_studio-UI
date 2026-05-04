import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
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
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimeSeriesChartProps {
  data: any[];
  features: string[];
  targetFeature?: string;
  title?: string;
  highlightTime?: number | null;
  onHighlightTime?: (time: number | null) => void;
}

const getFeatureColor = (index: number): string => {
  return `hsl(${index * 60}, 70%, 50%)`;
};

const adaptTimeFormat = (timeRange: number): { format: string; interval: number } => {
  const seconds = timeRange / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (days >= 1) {
    return { format: 'MM-DD HH:mm', interval: Math.ceil(days / 10) * 24 * 60 * 60 * 1000 };
  } else if (hours >= 1) {
    return { format: 'HH:mm', interval: Math.ceil(hours / 10) * 60 * 60 * 1000 };
  } else if (minutes >= 1) {
    return { format: 'HH:mm:ss', interval: Math.ceil(minutes / 10) * 60 * 1000 };
  } else {
    return { format: 'HH:mm:ss', interval: 1000 };
  }
};

const formatTimestamp = (timestamp: number | string | Date, formatStr: string): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  let result = formatStr;
  result = result.replace('MM-DD', `${month}-${day}`);
  result = result.replace('DD', day);
  result = result.replace('HH', HH);
  result = result.replace('mm', mm);
  result = result.replace('ss', ss);
  result = result.replace('MO', month);
  return result;
};

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  features,
  targetFeature,
  title,
  highlightTime,
  onHighlightTime,
}) => {
  const [visibleFeatures, setVisibleFeatures] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    features.forEach(f => initial[f] = true);
    if (targetFeature) initial[targetFeature] = true;
    return initial;
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mode, setMode] = useState<'raw' | 'normalized'>('raw');
  const [isHovering, setIsHovering] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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

  const timeRange = useMemo(() => {
    if (!data.length) return { format: 'HH:mm', interval: 60000 };
    const times = data.map(d => new Date(d.time).getTime()).filter(t => Number.isFinite(t));
    if (times.length < 2) return { format: 'HH:mm', interval: 60000 };
    const range = Math.max(...times) - Math.min(...times);
    return adaptTimeFormat(range);
  }, [data]);

  const ticks = useMemo(() => {
    if (!data.length) return [];
    const times = data.map(d => new Date(d.time).getTime()).filter(t => Number.isFinite(t));
    if (times.length < 2) return [];
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const tickCount = 6;
    const t: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      t.push(minTime + (maxTime - minTime) * (i / tickCount));
    }
    return t;
  }, [data]);

  const timeDomain = useMemo(() => {
    if (!data.length) return { min: 0, max: 0 };
    const times = data.map(d => new Date(d.time).getTime()).filter(t => Number.isFinite(t));
    if (!times.length) return { min: 0, max: 0 };
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [data]);

  const xAxisTickFormatter = useCallback((value: number) => {
    return formatTimestamp(value, timeRange.format);
  }, [timeRange.format]);

  const highlightDataPoint = useMemo(() => {
    if (highlightTime == null || !data.length) return null;
    const highlightTs = new Date(highlightTime).getTime();
    let closest: any = null;
    let minDiff = Infinity;
    for (const d of data) {
      const diff = Math.abs(new Date(d.time).getTime() - highlightTs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }
    return minDiff < 60000 ? closest : null;
  }, [highlightTime, data]);

  const tooltipPosition = useMemo(() => {
    if (!highlightDataPoint || !containerWidth || timeDomain.max === timeDomain.min) {
      return null;
    }
    const pointTime = new Date(highlightDataPoint.time).getTime();
    const chartWidth = containerWidth - 80;
    const ratio = (pointTime - timeDomain.min) / (timeDomain.max - timeDomain.min);
    const x = 65 + ratio * chartWidth;

    const tooltipWidth = 180;
    let left = x + 10;
    if (left + tooltipWidth > containerWidth - 10) {
      left = x - tooltipWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    return { x, left };
  }, [highlightDataPoint, containerWidth, timeDomain]);

  const handleMouseMove = useCallback((state: any) => {
    if (state?.isTooltipActive && state?.activeLabel != null) {
      const ts = typeof state.activeLabel === 'number'
        ? state.activeLabel
        : new Date(state.activeLabel).getTime();
      if (Number.isFinite(ts)) {
        setIsHovering(true);
        onHighlightTime?.(ts);
      }
    }
  }, [onHighlightTime]);

  const handleMouseLeave = useCallback((state: any) => {
    setIsHovering(false);
    onHighlightTime?.(null);
  }, [onHighlightTime]);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200 relative overflow-visible" ref={containerRef}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">
          {title || '特征信号图'} {mode === 'normalized' ? '(归一化)' : '(原始)'}
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative bg-gray-100 rounded-full p-0.5 flex">
            <div
              className={cn(
                "absolute top-0.5 left-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out",
                mode === 'normalized' && "translate-x-full"
              )}
            />
            <button
              onClick={() => setMode('raw')}
              className={cn(
                "relative z-10 px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200",
                mode === 'raw' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              原始特征
            </button>
            <button
              onClick={() => setMode('normalized')}
              className={cn(
                "relative z-10 px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200",
                mode === 'normalized' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              归一化特征
            </button>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200",
                isDropdownOpen
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
              )}
            >
              <span>图例选择</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-lg rounded-lg z-20 py-2">
                {allFeatures.map((feature, index) => {
                  const isTarget = feature === targetFeature;
                  const color = isTarget ? '#000000' : getFeatureColor(features.indexOf(feature));

                  return (
                    <div
                      key={feature}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleFeature(feature)}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0",
                          visibleFeatures[feature]
                            ? "bg-indigo-600 border-indigo-600"
                            : "bg-white border-gray-300"
                        )}
                      >
                        {visibleFeatures[feature] && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>

                      <svg width="20" height="4" className="flex-shrink-0">
                        {isTarget ? (
                          <line
                            x1="0"
                            y1="2"
                            x2="20"
                            y2="2"
                            stroke={color}
                            strokeWidth="2"
                            strokeDasharray="4,2"
                          />
                        ) : (
                          <line
                            x1="0"
                            y1="2"
                            x2="20"
                            y2="2"
                            stroke={color}
                            strokeWidth="2"
                          />
                        )}
                      </svg>

                      <span
                        className="text-xs flex-1 truncate"
                        style={{ color }}
                      >
                        {feature}
                        {isTarget && (
                          <span className="text-gray-400 ml-1">(Target)</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-56 relative overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={xAxisTickFormatter}
              ticks={ticks}
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: '#9ca3af' }}
              label={{ value: '时间', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              label={{ value: '值', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const timestamp = formatTimestamp(label as number, 'MM-DD HH:mm:ss');

                return (
                  <div className="bg-white/75 backdrop-blur-sm border border-gray-200 shadow-xl rounded-lg p-3 min-w-[180px]">
                    <p className="text-xs text-gray-500 mb-2 font-medium border-b border-gray-100 pb-2">
                      {timestamp}
                    </p>
                    <div className="space-y-1.5">
                      {payload.map((entry: any, index: number) => {
                        const featureName = entry.dataKey;
                        const isTarget = featureName === targetFeature;
                        const originalIndex = features.indexOf(featureName);
                        const color = isTarget ? '#000000' : getFeatureColor(originalIndex);
                        const value = mode === 'normalized'
                          ? Number(entry.value).toFixed(4)
                          : Number(entry.value).toFixed(2);

                        return (
                          <div key={index} className="flex items-center gap-2">
                            <svg width="24" height="8" className="flex-shrink-0">
                              {isTarget ? (
                                <line x1="0" y1="4" x2="24" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4,2" />
                              ) : (
                                <line x1="0" y1="4" x2="24" y2="4" stroke={color} strokeWidth="2" />
                              )}
                            </svg>
                            <span className="text-xs text-gray-700 truncate flex-1">
                              {featureName}{isTarget ? ' (Target)' : ''}
                            </span>
                            <span className="text-xs font-medium text-gray-900" style={{ color }}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            {highlightDataPoint && !isHovering && (
              <ReferenceLine
                x={new Date(highlightDataPoint.time).getTime()}
                stroke="#6366f1"
                strokeDasharray="3 3"
                strokeWidth={2}
              />
            )}
            {features.map((feature, index) => visibleFeatures[feature] && (
              <Line
                key={feature}
                type="monotone"
                dataKey={feature}
                stroke={getFeatureColor(index)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: getFeatureColor(index) }}
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
                activeDot={{ r: 5, strokeWidth: 0, fill: '#000000' }}
                name={targetFeature}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {highlightDataPoint && !isHovering && tooltipPosition && (
          <div
            className="absolute top-8 bg-white/75 backdrop-blur-sm border border-indigo-200 shadow-xl rounded-lg p-3 min-w-[160px] z-30 pointer-events-none"
            style={{ left: tooltipPosition.left }}
          >
            <p className="text-xs text-gray-500 mb-2 font-medium border-b border-gray-100 pb-2">
              {formatTimestamp(highlightDataPoint.time, 'MM-DD HH:mm:ss')}
            </p>
            <div className="space-y-1.5">
              {allFeatures.map((feature) => {
                const isTarget = feature === targetFeature;
                const originalIndex = features.indexOf(feature);
                const color = isTarget ? '#000000' : getFeatureColor(originalIndex);
                const val = chartData.find((d: any) => new Date(d.time).getTime() === new Date(highlightDataPoint.time).getTime())?.[feature];
                if (val == null) return null;
                const value = mode === 'normalized'
                  ? Number(val).toFixed(4)
                  : Number(val).toFixed(2);

                return (
                  <div key={feature} className="flex items-center gap-2">
                    <svg width="20" height="6" className="flex-shrink-0">
                      {isTarget ? (
                        <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2" strokeDasharray="4,2" />
                      ) : (
                        <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2" />
                      )}
                    </svg>
                    <span className="text-xs text-gray-700 truncate flex-1">
                      {feature}{isTarget ? ' (Target)' : ''}
                    </span>
                    <span className="text-xs font-medium" style={{ color }}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
