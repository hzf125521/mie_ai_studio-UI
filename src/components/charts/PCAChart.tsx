import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { Info } from 'lucide-react';

interface PCAChartProps {
  data: any[];
  highlightTime?: number | null;
  onHighlightTime?: (time: number | null) => void;
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

const HighlightDot: React.FC<{
  cx: number;
  cy: number;
  fill: string;
  isHighlighted: boolean;
  isDimmed: boolean;
  highlightFill: string;
  highlightStroke: string;
  normalR: number;
  highlightR: number;
}> = ({ cx, cy, fill, isHighlighted, isDimmed, highlightFill, highlightStroke, normalR, highlightR }) => {
  if (isHighlighted) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={highlightR + 2} fill={highlightStroke} opacity={0.3} />
        <circle cx={cx} cy={cy} r={highlightR} fill={highlightFill} stroke={highlightStroke} strokeWidth={2} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={normalR} fill={fill} opacity={isDimmed ? 0.25 : 0.8} />;
};

export const PCAChart: React.FC<PCAChartProps> = ({ data, highlightTime, onHighlightTime }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [chartAreaWidth, setChartAreaWidth] = useState(0);
  const [chartAreaHeight, setChartAreaHeight] = useState(0);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (chartAreaRef.current) {
        setChartAreaWidth(chartAreaRef.current.offsetWidth);
        setChartAreaHeight(chartAreaRef.current.offsetHeight);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const pcaData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      x: d.x !== undefined ? d.x : (d.value1 || 0) * 2 + Math.random(),
      y: d.y !== undefined ? d.y : (d.value2 || 0) * 2 + Math.random(),
      z: d.z !== undefined ? d.z : (d.value1 || 0) - (d.value2 || 0) + Math.random(),
      type: d.type || (i % 10 === 0 ? 'Anomaly' : 'Normal'),
    }));
  }, [data]);

  const pcaDomain = useMemo(() => {
    if (!pcaData.length) return { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
    const xs = pcaData.map(d => d.x).filter((v: number) => Number.isFinite(v));
    const ys = pcaData.map(d => d.y).filter((v: number) => Number.isFinite(v));
    if (!xs.length || !ys.length) return { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.1 || 1;
    const yPad = (yMax - yMin) * 0.1 || 1;
    return { xMin: xMin - xPad, xMax: xMax + xPad, yMin: yMin - yPad, yMax: yMax + yPad };
  }, [pcaData]);

  const isHighlighted = useCallback((point: any) => {
    if (highlightTime == null || point.time == null) return false;
    return Math.abs(new Date(point.time).getTime() - new Date(highlightTime).getTime()) < 60000;
  }, [highlightTime]);

  const isDimmed = useCallback(() => highlightTime != null, [highlightTime]);

  const highlightPoint = useMemo(() => {
    if (highlightTime == null || !pcaData.length) return null;
    const highlightTs = new Date(highlightTime).getTime();
    let closest: any = null;
    let minDiff = Infinity;
    for (const d of pcaData) {
      if (d.time == null) continue;
      const diff = Math.abs(new Date(d.time).getTime() - highlightTs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }
    return minDiff < 60000 ? closest : null;
  }, [highlightTime, pcaData]);

  const highlightPixelPos = useMemo(() => {
    if (!highlightPoint || !chartAreaWidth || !chartAreaHeight) return null;
    const { xMin, xMax, yMin, yMax } = pcaDomain;
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const leftMargin = 55;
    const bottomMargin = 35;
    const topMargin = 10;
    const rightMargin = 10;
    const plotWidth = chartAreaWidth - leftMargin - rightMargin;
    const plotHeight = chartAreaHeight - topMargin - bottomMargin;

    const xRatio = (highlightPoint.x - xMin) / xRange;
    const yRatio = (highlightPoint.y - yMin) / yRange;
    const px = leftMargin + xRatio * plotWidth;
    const py = topMargin + (1 - yRatio) * plotHeight;

    return { px, py };
  }, [highlightPoint, chartAreaWidth, chartAreaHeight, pcaDomain]);

  const tooltipPosition = useMemo(() => {
    if (!highlightPixelPos || !chartAreaWidth || !chartAreaHeight) return null;
    const { px, py } = highlightPixelPos;

    const tooltipWidth = 160;
    const tooltipHeight = 100;

    let left = px + 12;
    let top = py - tooltipHeight / 2;

    if (left + tooltipWidth > chartAreaWidth - 5) {
      left = px - tooltipWidth - 12;
    }
    if (left < 5) {
      left = 5;
    }
    if (top < 5) {
      top = 5;
    }
    if (top + tooltipHeight > chartAreaHeight - 5) {
      top = chartAreaHeight - tooltipHeight - 5;
    }

    return { left, top };
  }, [highlightPixelPos, chartAreaWidth, chartAreaHeight]);

  const makeShape = (normalFill: string, highlightFill: string, highlightStroke: string, normalR: number, highlightR: number) => {
    const ShapeFn = (props: any) => {
      const { cx, cy, payload } = props;
      return (
        <HighlightDot
          cx={cx}
          cy={cy}
          fill={normalFill}
          isHighlighted={isHighlighted(payload)}
          isDimmed={isDimmed() && !isHighlighted(payload)}
          highlightFill={highlightFill}
          highlightStroke={highlightStroke}
          normalR={normalR}
          highlightR={highlightR}
        />
      );
    };
    ShapeFn.displayName = 'HighlightDot';
    return ShapeFn;
  };

  const handleScatterMouseEnter = useCallback((point: any) => {
    if (point?.time != null) {
      setIsHovering(true);
      const ts = typeof point.time === 'number' ? point.time : new Date(point.time).getTime();
      onHighlightTime?.(ts);
    }
  }, [onHighlightTime]);

  const handleScatterMouseLeave = useCallback(() => {
    setIsHovering(false);
    onHighlightTime?.(null);
  }, [onHighlightTime]);

  const pcaTickFormatter = useCallback((value: number) => {
    return Number(value).toFixed(2);
  }, []);

  return (
    <div className="h-full w-full bg-white rounded-lg p-4 relative flex flex-col overflow-visible">
      <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-500">2D-PCA</h3>
        <div
          className="relative"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <Info className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 cursor-help" />
          {showInfo && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
              <p className="font-medium text-gray-300 mb-1">2D-PCA 说明</p>
              <p>将高维特征数据通过主成分分析降维至二维空间，每个散点代表一个时间采样点。空间距离越近，特征模式越相似。可辅助观察数据聚类和异常点分布。</p>
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-visible" ref={chartAreaRef}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="x"
              name="pca_0"
              stroke="#9ca3af"
              fontSize={11}
              domain={[pcaDomain.xMin, pcaDomain.xMax]}
              tickFormatter={pcaTickFormatter}
              label={{ value: 'pca_0', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="pca_1"
              stroke="#9ca3af"
              fontSize={11}
              domain={[pcaDomain.yMin, pcaDomain.yMax]}
              tickFormatter={pcaTickFormatter}
              label={{ value: 'pca_1', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
            />
            <ZAxis type="number" dataKey="z" range={[0, 500]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-lg p-3 min-w-[140px]">
                      <p className="text-xs text-gray-500 mb-1.5 font-medium border-b border-gray-100 pb-1.5">
                        {d.time != null ? formatTimestamp(d.time) : ''}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-gray-500">pca_0</span>
                          <span className="text-xs font-medium text-gray-800">{d.x != null ? d.x.toFixed(2) : '-'}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-gray-500">pca_1</span>
                          <span className="text-xs font-medium text-gray-800">{d.y != null ? d.y.toFixed(2) : '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              name="Normal"
              data={pcaData.filter(d => d.type === 'Normal')}
              fill="#10b981"
              shape={makeShape('#10b981', '#059669', '#047857', 4, 7)}
              onMouseEnter={handleScatterMouseEnter}
              onMouseLeave={handleScatterMouseLeave}
            />
            <Scatter
              name="Anomaly"
              data={pcaData.filter(d => d.type === 'Anomaly')}
              fill="#ef4444"
              shape="cross"
              onMouseEnter={handleScatterMouseEnter}
              onMouseLeave={handleScatterMouseLeave}
            />
            <Scatter
              name="Data"
              data={pcaData.filter(d => d.type === 'Data')}
              fill="#6366f1"
              shape={makeShape('#6366f1', '#4f46e5', '#3730a3', 3, 6)}
              onMouseEnter={handleScatterMouseEnter}
              onMouseLeave={handleScatterMouseLeave}
            />
            <Scatter
              name="Alarm"
              data={pcaData.filter(d => d.isAlarm)}
              fill="#ef4444"
              shape="cross"
              onMouseEnter={handleScatterMouseEnter}
              onMouseLeave={handleScatterMouseLeave}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {highlightPoint && !isHovering && highlightPixelPos && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            style={{ overflow: 'visible' }}
          >
            <circle
              cx={highlightPixelPos.px}
              cy={highlightPixelPos.py}
              r={10}
              fill="#6366f1"
              opacity={0.2}
            />
            <circle
              cx={highlightPixelPos.px}
              cy={highlightPixelPos.py}
              r={6}
              fill="#4f46e5"
              stroke="#3730a3"
              strokeWidth={2}
            />
          </svg>
        )}

        {highlightPoint && !isHovering && tooltipPosition && (
          <div
            className="absolute bg-white/95 backdrop-blur-sm border border-indigo-200 shadow-xl rounded-lg p-3 min-w-[140px] z-30 pointer-events-none"
            style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
          >
            <p className="text-xs text-gray-500 mb-1.5 font-medium border-b border-gray-100 pb-1.5">
              {formatTimestamp(highlightPoint.time)}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-xs text-gray-500">pca_0</span>
                <span className="text-xs font-medium text-indigo-600">{highlightPoint.x != null ? highlightPoint.x.toFixed(2) : '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-xs text-gray-500">pca_1</span>
                <span className="text-xs font-medium text-indigo-600">{highlightPoint.y != null ? highlightPoint.y.toFixed(2) : '-'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
