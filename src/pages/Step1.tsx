import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { PCAChart } from '../components/charts/PCAChart';
import { FeatureCorrelationHeatmap } from '../components/charts/FeatureCorrelationHeatmap';
import { Plus, Trash2, Calendar, Activity, Edit2, Check, X, Search, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { SignalInfoTooltip } from '../components/SignalInfoTooltip';

const MEASUREMENT_POINTS = [
  { id: 'PointA', name: 'Measurement Point A', features: ['Temp', 'Pressure', 'Vibration'] },
  { id: 'PointB', name: 'Measurement Point B', features: ['Speed', 'Current', 'Voltage'] },
];

const FeatureTreeSelect: React.FC<{
  selected: Record<string, string[]>;
  onChange: (selected: Record<string, string[]>) => void;
  excludeFeature?: string;
}> = ({ selected, onChange, excludeFeature }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set(MEASUREMENT_POINTS.map(p => p.id)));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCount = useMemo(() => {
    return (Object.values(selected) as string[][]).reduce((sum, features) => sum + features.length, 0);
  }, [selected]);

  const togglePoint = (pointId: string) => {
    setExpandedPoints(prev => {
      const next = new Set(prev);
      if (next.has(pointId)) {
        next.delete(pointId);
      } else {
        next.add(pointId);
      }
      return next;
    });
  };

  const isFeatureSelected = (pointId: string, feature: string) => {
    return selected[pointId]?.includes(feature) ?? false;
  };

  const toggleFeature = (pointId: string, feature: string) => {
    const currentFeatures = selected[pointId] || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    onChange({ ...selected, [pointId]: newFeatures });
  };

  const isPointAllSelected = (pointId: string, availableFeatures: string[]) => {
    const currentFeatures = selected[pointId] || [];
    return availableFeatures.length > 0 && availableFeatures.every(f => currentFeatures.includes(f));
  };

  const isPointPartialSelected = (pointId: string, availableFeatures: string[]) => {
    const currentFeatures = selected[pointId] || [];
    const selectedCount = availableFeatures.filter(f => currentFeatures.includes(f)).length;
    return selectedCount > 0 && selectedCount < availableFeatures.length;
  };

  const togglePointAll = (pointId: string, availableFeatures: string[]) => {
    const currentFeatures = selected[pointId] || [];
    const allSelected = isPointAllSelected(pointId, availableFeatures);
    const newFeatures = allSelected ? [] : [...availableFeatures];
    onChange({ ...selected, [pointId]: newFeatures });
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">学习特征（X）</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-left focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs flex justify-between items-center"
      >
        <span className="block truncate">
          {totalCount === 0 ? '请选择特征...' : `已选择${totalCount}个特征`}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-72 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto">
          {MEASUREMENT_POINTS.map(point => {
            const availableFeatures = excludeFeature
              ? point.features.filter(f => `${point.id}_${f}` !== excludeFeature)
              : point.features;
            const isExpanded = expandedPoints.has(point.id);
            const allSelected = isPointAllSelected(point.id, availableFeatures);
            const partialSelected = isPointPartialSelected(point.id, availableFeatures);

            return (
              <div key={point.id} className="select-none">
                <div
                  className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => togglePoint(point.id)}
                >
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-gray-400 mr-2 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = partialSelected;
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      togglePointAll(point.id, availableFeatures);
                    }}
                    readOnly
                  />
                  <span className="font-medium text-xs text-gray-700">{point.name}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    {selected[point.id]?.length || 0}/{availableFeatures.length}
                  </span>
                </div>
                {isExpanded && (
                  <div className="bg-gray-50">
                    {availableFeatures.map(feature => (
                      <div
                        key={feature}
                        className="flex items-center py-1.5 pl-10 pr-3 hover:bg-indigo-50 cursor-pointer"
                        onClick={() => toggleFeature(point.id, feature)}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                          checked={isFeatureSelected(point.id, feature)}
                          readOnly
                        />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Step1: React.FC = () => {
  const { signals, addSignal, updateSignal, removeSignal, workflow, models, validations } = useApp();
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('2023-01-01T00:00');
  const [endTime, setEndTime] = useState('2023-01-02T00:00');
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, string[]>>({});
  const [selectedTarget, setSelectedTarget] = useState('');
  const [previewSignal, setPreviewSignal] = useState<any | null>(null);
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [hoveredSignalId, setHoveredSignalId] = useState<string | null>(null);

  useEffect(() => {
    setPreviewSignal(null);
    if (!selectedTarget) return;
    const parts = selectedTarget.split('_');
    if (parts.length !== 2) return;
    const [pointId, featureName] = parts;
    if (!selectedFeatures[pointId]?.includes(featureName)) return;
    setSelectedFeatures(prev => ({
      ...prev,
      [pointId]: prev[pointId].filter(f => f !== featureName),
    }));
  }, [selectedTarget, selectedFeatures]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingId && !(event.target as HTMLElement).closest('.editing-container')) {
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId]);

  const allFeatures = useMemo(() => {
    return MEASUREMENT_POINTS.flatMap(point => point.features.map(f => `${point.id}_${f}`));
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter(s => {
      const matchName = s.name.toLowerCase().includes(filterName.toLowerCase());
      const matchDate = filterDate ? s.createdAt.startsWith(filterDate) : true;
      return matchName && matchDate;
    });
  }, [signals, filterName, filterDate]);

  const displaySignal = useMemo(() => {
    if (previewSignal) return previewSignal;
    if (selectedSignalIds.length > 0) {
      const latestSelectedId = selectedSignalIds[selectedSignalIds.length - 1];
      return signals.find(s => s.id === latestSelectedId) || null;
    }
    return [...signals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
  }, [previewSignal, selectedSignalIds, signals]);

  const handleFeatureChange = (pointId: string, features: string[]) => {
    setSelectedFeatures(prev => ({ ...prev, [pointId]: features }));
    setPreviewSignal(null);
  };

  const generateSignalData = () => {
    const now = new Date();
    const timeString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    let name = `Signal_${timeString}`;

    let counter = 1;
    const originalName = name;
    while (signals.some(s => s.name === name)) {
      name = `${originalName}_${counter}`;
      counter++;
    }

    const flatFeatures = Object.entries(selectedFeatures).flatMap(([pointId, feats]) =>
      (feats as string[]).map(f => `${pointId}_${f}`)
    );

    if (flatFeatures.length === 0) {
      alert('Please select at least one feature.');
      return null;
    }

    if (workflow === 'regression' && !selectedTarget) {
      alert('Please select a target feature.');
      return null;
    }

    if (workflow === 'regression' && flatFeatures.includes(selectedTarget)) {
      alert('Target feature cannot be included in input features.');
      return null;
    }

    const id = `sig-preview-${Date.now()}`;
    const mockData = Array.from({ length: 50 }, (_, i) => {
      const point: Record<string, any> = { time: i };
      const scales = [1, 100, 1000];
      flatFeatures.forEach((feature, idx) => {
        const scale = scales[idx % scales.length];
        const base = (Math.sin(i * 0.2 + idx) + 1) / 2; // ~0..1
        const noise = Math.random() * 0.1;
        point[feature] = (base + noise) * scale;
      });

      if (workflow === 'regression' && selectedTarget) {
        let sumX = 0;
        flatFeatures.forEach(f => {
          sumX += Number(point[f] || 0);
        });
        point[selectedTarget] = sumX / Math.max(flatFeatures.length, 1) + Math.random() * 5;
      }

      point.x = Math.random() * 10;
      point.y = Math.random() * 10;
      point.z = Math.random() * 10;
      point.anomalyScore = Math.random();
      point.type = Math.random() > 0.9 ? 'Anomaly' : 'Normal';
      return point;
    });

    return {
      id,
      name,
      createdAt: now.toISOString(),
      timeRange: [startTime, endTime],
      features: flatFeatures,
      targetFeature: workflow === 'regression' ? selectedTarget : undefined,
      data: mockData,
      isPreview: true,
    };
  };

  const handlePreviewSignal = () => {
    const newSignal = generateSignalData();
    if (newSignal) setPreviewSignal(newSignal);
  };

  const handleAddSignal = () => {
    let signalToAdd = previewSignal;
    if (!signalToAdd) signalToAdd = generateSignalData();
    if (!signalToAdd) return;

    const finalSignal = {
      ...signalToAdd,
      id: `sig-${Date.now()}`,
      isPreview: false,
    };
    addSignal(finalSignal);
    setPreviewSignal(null);
  };

  const toggleSignalSelection = (id: string) => {
    if (selectedSignalIds.includes(id)) {
      setSelectedSignalIds(selectedSignalIds.filter(sid => sid !== id));
      return;
    }
    if (selectedSignalIds.length >= 5) {
      alert('At most 5 signals can be selected.');
      return;
    }
    setSelectedSignalIds([...selectedSignalIds, id]);
  };

  const startEditing = (signal: any) => {
    setEditingId(signal.id);
    setEditName(signal.name);
  };

  const saveEditing = (id: string) => {
    if (signals.some(s => s.name === editName && s.id !== id)) {
      alert('Signal name already exists.');
      return;
    }
    updateSignal(id, { name: editName });
    setEditingId(null);
  };

  const handleRemoveSignal = (id: string) => {
    const isUsed =
      models?.some(m => m.trainSignalIds?.includes(id)) ||
      validations?.some(v => v.signalIds?.includes(id));
    if (isUsed) {
      alert('This signal is currently used by model training/validation and cannot be removed.');
      return;
    }
    removeSignal(id);
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-96 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" /> Add Signal
          </h2>
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <FeatureTreeSelect
              selected={selectedFeatures}
              onChange={(features) => {
                setSelectedFeatures(features);
                setPreviewSignal(null);
              }}
              excludeFeature={workflow === 'regression' ? selectedTarget : undefined}
            />

            {workflow === 'regression' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target Feature (y)</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => {
                    setSelectedTarget(e.target.value);
                    setPreviewSignal(null);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-md py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select target...</option>
                  {allFeatures.map(f => {
                    const [pointId, featureName] = f.split('_');
                    const isSelected = selectedFeatures[pointId]?.includes(featureName);
                    return (
                      <option key={f} value={f} disabled={isSelected}>
                        {f}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setPreviewSignal(null);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setPreviewSignal(null);
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={handlePreviewSignal}
                className="w-full flex justify-center py-2 px-4 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Preview
              </button>
              <button
                onClick={handleAddSignal}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Signal
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" /> Signals
          </h3>

          <div className="mb-3 space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-md text-xs"
              />
              <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-2" />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {filteredSignals.map((signal) => (
                <li
                  key={signal.id}
                  className={cn(
                    'group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                    selectedSignalIds.includes(signal.id)
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300'
                      : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                  )}
                  onMouseEnter={() => setHoveredSignalId(signal.id)}
                  onMouseLeave={() => setHoveredSignalId(null)}
                  onClick={() => toggleSignalSelection(signal.id)}
                >
                  <div className="flex flex-col flex-1 min-w-0 mr-2">
                    {editingId === signal.id ? (
                      <div className="flex items-center gap-1 editing-container" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full px-1 py-0.5 text-xs border border-indigo-300 rounded"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditing(signal.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button onClick={() => saveEditing(signal.id)} className="text-green-600">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 h-5">
                        <span className="text-sm font-medium text-gray-900 truncate" title={signal.name}>
                          {signal.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(signal);
                          }}
                          className={cn(
                            'text-gray-400 hover:text-indigo-600 transition-opacity duration-200 p-1 rounded hover:bg-gray-100',
                            hoveredSignalId === signal.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          )}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />{' '}
                      {new Date(signal.createdAt).toLocaleString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSignal(signal.id);
                    }}
                    className={cn(
                      'p-1 text-gray-400 hover:text-red-500 transition-opacity duration-200 rounded hover:bg-gray-100',
                      hoveredSignalId === signal.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )}
                    title="Delete signal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {filteredSignals.length === 0 && (
                <li className="text-sm text-gray-400 text-center py-4 italic">No signal found.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {displaySignal ? (
          <div
            key={displaySignal.id}
            className={cn(
              'bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md',
              displaySignal.isPreview ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'
            )}
          >
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{displaySignal.name}</h3>
                {displaySignal.isPreview && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-medium border border-indigo-200">
                    Preview
                  </span>
                )}
                <SignalInfoTooltip signal={displaySignal} />
              </div>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                Created: {new Date(displaySignal.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="space-y-6">
              <div className="h-80 flex flex-col">
                <div className="flex-1">
                  <TimeSeriesChart
                    data={displaySignal.data}
                    features={displaySignal.features}
                    targetFeature={displaySignal.targetFeature}
                    title={workflow === 'regression' ? 'Input Features VS Target Feature' : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 flex flex-col">
                  <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                    <PCAChart data={displaySignal.data.map((d: any) => ({ ...d, type: 'Data' }))} />
                  </div>
                </div>
                <div className="h-72 flex flex-col">
                  <div className="flex-1">
                    <FeatureCorrelationHeatmap data={displaySignal.data} features={displaySignal.features} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No signal to display.</p>
            <p className="text-sm">Please select a signal on the left or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
