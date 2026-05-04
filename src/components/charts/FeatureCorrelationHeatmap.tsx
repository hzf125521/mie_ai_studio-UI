import React, { useMemo, useState } from 'react';
import { Info } from 'lucide-react';

interface FeatureCorrelationHeatmapProps {
  data: any[];
  features: string[];
}

const toColor = (value: number) => {
  // Map [-1, 1] to a blue-white-red diverging palette.
  const clamped = Math.max(-1, Math.min(1, value));
  const hue = clamped >= 0 ? 0 : 220;
  const lightness = 96 - Math.abs(clamped) * 46;
  return `hsl(${hue}, 70%, ${lightness}%)`;
};

const pearson = (a: number[], b: number[]) => {
  const n = Math.min(a.length, b.length);
  if (n <= 1) return 0;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }

  if (varA === 0 || varB === 0) return 0;
  return cov / Math.sqrt(varA * varB);
};

export const FeatureCorrelationHeatmap: React.FC<FeatureCorrelationHeatmapProps> = ({ data, features }) => {
  const [showInfo, setShowInfo] = useState(false);
  const matrix = useMemo(() => {
    const cols = features.map((feature) =>
      data.map((row) => {
        const value = Number(row[feature]);
        return Number.isFinite(value) ? value : 0;
      })
    );

    return features.map((_, i) =>
      features.map((__, j) => {
        if (i === j) return 1;
        return pearson(cols[i], cols[j]);
      })
    );
  }, [data, features]);

  return (
    <div className="h-full w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col overflow-visible">
      <div className="flex items-center gap-1.5 mb-3 flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-500">特征相关性热力图</h3>
        <div
          className="relative"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <Info className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 cursor-help" />
          {showInfo && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
              <p className="font-medium text-gray-300 mb-1">特征相关性说明</p>
              <p>展示特征之间的皮尔逊相关系数矩阵。颜色越深表示相关性越强，红色为正相关，蓝色为负相关。取值范围 [-1, 1]，1 表示完全正相关，-1 表示完全负相关。</p>
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      </div>
      {features.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          No feature data
        </div>
      ) : (
        <div
          className="flex-1 overflow-auto grid gap-1 text-[10px]"
          style={{
            gridTemplateColumns: `80px repeat(${features.length}, minmax(36px, 1fr))`,
            minWidth: `${80 + features.length * 40}px`,
          }}
        >
          <div />
          {features.map((f) => (
            <div key={`col-${f}`} className="text-gray-500 text-center truncate px-1" title={f}>
              {f}
            </div>
          ))}

          {features.map((rowFeature, i) => (
            <React.Fragment key={`row-${rowFeature}`}>
              <div className="text-gray-500 truncate pr-1" title={rowFeature}>
                {rowFeature}
              </div>
              {features.map((colFeature, j) => {
                const value = matrix[i][j];
                return (
                  <div
                    key={`${rowFeature}-${colFeature}`}
                    className="h-8 rounded border border-white/70 flex items-center justify-center text-gray-700"
                    style={{ backgroundColor: toColor(value) }}
                    title={`${rowFeature} vs ${colFeature}: ${value.toFixed(2)}`}
                  >
                    {value.toFixed(2)}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
