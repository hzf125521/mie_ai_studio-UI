import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import { CheckCircle, Play, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { PCAChart } from '../components/charts/PCAChart';
import { AnomalyChart } from '../components/charts/AnomalyChart';
import { ThreeDScatterChart } from '../components/charts/ThreeDScatterChart';
import { SignalInfoTooltip } from '../components/SignalInfoTooltip';
import { ModelList } from '../components/ModelList';

export const Step3: React.FC = () => {
  const { models, signals, validations, addValidation, updateModel } = useApp();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [selectedValidationSignalIds, setSelectedValidationSignalIds] = useState<string[]>([]);
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);

  // Default to newest trained model
  const displayModel = useMemo(() => {
    const trainedModels = models.filter(m => m.status === 'completed');
    if (selectedModelId) {
      return trainedModels.find(m => m.id === selectedModelId);
    }
    if (trainedModels.length > 0) {
      return [...trainedModels].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }
    return null;
  }, [selectedModelId, models]);

  const trainedModels = models.filter((m) => m.status === 'completed');
  
  const trainingSignals = useMemo(() => {
    if (!displayModel) return [];
    return signals.filter(s => displayModel.trainSignalIds?.includes(s.id));
  }, [displayModel, signals]);

  const modelValidations = useMemo(() => {
    if (!displayModel) return [];
    return validations.filter(v => v.modelId === displayModel.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [displayModel, validations]);

  const displayValidation = useMemo(() => {
    if (selectedValidationId) {
      return modelValidations.find(v => v.id === selectedValidationId);
    }
    return modelValidations.length > 0 ? modelValidations[0] : null;
  }, [selectedValidationId, modelValidations]);
  
  const validationSignals = useMemo(() => {
    if (!displayValidation) return [];
    return signals.filter(s => displayValidation.signalIds.includes(s.id));
  }, [displayValidation, signals]);

  const mergedValidationData = useMemo(() => {
    return validationSignals.flatMap(s => s.data);
  }, [validationSignals]);

  const handleValidationSignalToggle = (signalId: string) => {
    if (selectedValidationSignalIds.includes(signalId)) {
      setSelectedValidationSignalIds(selectedValidationSignalIds.filter(id => id !== signalId));
    } else {
      // Check compatibility with TRAINING signals
      if (displayModel && displayModel.trainSignalIds.length > 0) {
        const trainingSignal = signals.find(s => s.id === displayModel.trainSignalIds[0]);
        const targetSignal = signals.find(s => s.id === signalId);
        
        if (trainingSignal && targetSignal) {
          const trainFeatures = trainingSignal.features.slice().sort().join(',');
          const targetFeatures = targetSignal.features.slice().sort().join(',');
          
          if (trainFeatures !== targetFeatures) {
            alert('Selected signal must have the same features as the training data.');
            return;
          }
        }
      }
      setSelectedValidationSignalIds([...selectedValidationSignalIds, signalId]);
    }
  };

  const handleRunValidation = () => {
    if (!displayModel || selectedValidationSignalIds.length === 0) return;

    updateModel(displayModel.id, { isValidating: true });
    setIsValidationModalOpen(false);
    
    // Simulate validation process
    setTimeout(() => {
      const newValidation = {
        id: `val-${Date.now()}`,
        modelId: displayModel.id,
        signalIds: selectedValidationSignalIds,
        createdAt: new Date().toISOString(),
        metrics: {
          roc: 0.90 + Math.random() * 0.08,
          precision: 0.88 + Math.random() * 0.08,
        },
      };
      
      addValidation(newValidation);
      updateModel(displayModel.id, { isValidating: false });
      setSelectedValidationSignalIds([]);
      setSelectedValidationId(newValidation.id); // Select the new validation
    }, 2000);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar: Trained Models */}
      <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" /> Trained Models
        </h3>
        <ModelList 
          models={trainedModels}
          selectedModelId={selectedModelId}
          onSelectModel={(id) => { setSelectedModelId(id); setSelectedValidationId(null); }}
          displayModelId={displayModel?.id}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {displayModel ? (
          <div className="space-y-6">
            {/* Model Info Header */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Model Type</span>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{displayModel.type}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preprocessing</span>
                  <div className="mt-1 text-xs text-gray-600">
                    <p>Standardization: {displayModel.preprocessing?.standardization ? 'Yes' : 'No'}</p>
                    <p>PCA: {displayModel.preprocessing?.pca || 'None'}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Model Parameters</span>
                  <div className="mt-1 text-xs text-gray-600 grid grid-cols-2 gap-x-4">
                    {Object.entries(displayModel.parameters).map(([key, value]) => (
                      <span key={key} className="capitalize">{key}: {value}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Training Signals</span>
                    <div className="flex flex-wrap gap-2">
                    {trainingSignals.map(s => (
                        <div key={s.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200 text-sm">
                        {s.name}
                        <SignalInfoTooltip signal={s} />
                        </div>
                    ))}
                    </div>
                </div>
                <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Training Metric</span>
                    <div className="flex gap-4">
                        <div className="bg-white px-3 py-2 rounded border border-gray-200">
                            <span className="text-xs text-gray-500 block">ROC Score</span>
                            <span className="text-sm font-bold text-indigo-600">{displayModel.metrics?.roc.toFixed(4)}</span>
                        </div>
                        <div className="bg-white px-3 py-2 rounded border border-gray-200">
                            <span className="text-xs text-gray-500 block">Precision</span>
                            <span className="text-sm font-bold text-indigo-600">{displayModel.metrics?.precision.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Validation Results</h2>
              <button
                onClick={() => setIsValidationModalOpen(true)}
                disabled={!!displayModel.isValidating}
                className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" /> New Validation
              </button>
            </div>

            {displayModel.isValidating ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Running validation...</p>
              </div>
            ) : displayValidation ? (
              <>
                 {/* Validation History Selector */}
                 {modelValidations.length > 1 && (
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap">History:</span>
                        {modelValidations.map((val, idx) => (
                            <button
                                key={val.id}
                                onClick={() => setSelectedValidationId(val.id)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs border transition-colors whitespace-nowrap",
                                    (displayValidation.id === val.id)
                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                #{modelValidations.length - idx} - {new Date(val.createdAt).toLocaleString()}
                            </button>
                        ))}
                    </div>
                 )}

                 <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs font-medium text-blue-500 uppercase tracking-wider block mb-2">Validation Signals</span>
                            <div className="flex flex-wrap gap-2">
                                {validationSignals.map(s => (
                                <div key={s.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-200 text-sm">
                                    {s.name}
                                    <SignalInfoTooltip signal={s} />
                                </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-blue-500 uppercase tracking-wider block mb-2">Validation Metric</span>
                            <div className="flex gap-4">
                                <div className="bg-white px-3 py-2 rounded border border-blue-200">
                                    <span className="text-xs text-gray-500 block">Validation ROC</span>
                                    <span className="text-sm font-bold text-indigo-600">{displayValidation.metrics.roc.toFixed(4)}</span>
                                </div>
                                <div className="bg-white px-3 py-2 rounded border border-blue-200">
                                    <span className="text-xs text-gray-500 block">Validation Precision</span>
                                    <span className="text-sm font-bold text-indigo-600">{displayValidation.metrics.precision.toFixed(4)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-72 flex flex-col">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Anomaly Score vs Threshold</h3>
                    <div className="flex-1">
                      <AnomalyChart data={mergedValidationData} threshold={0.8} />
                    </div>
                  </div>
                  <div className="h-72 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-500">PCA Projection</h3>
                    </div>
                    <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative">
                       <ChartContainer data={mergedValidationData} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Activity className="w-12 h-12 mb-3 opacity-20" />
                <p>No validation run yet.</p>
                <p className="text-sm">Click "New Validation" to test this model.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Select a trained model to validate.</p>
          </div>
        )}
      </div>

      {/* Validation Modal */}
      <Modal isOpen={isValidationModalOpen} onClose={() => setIsValidationModalOpen(false)} title="Run New Validation">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select signals to validate against the model <strong>{displayModel?.name}</strong>.</p>
          
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
            {signals.length > 0 ? (
              <div className="space-y-2">
                {signals.map((signal) => (
                  <label key={signal.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 cursor-pointer hover:bg-indigo-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedValidationSignalIds.includes(signal.id)}
                        onChange={() => handleValidationSignalToggle(signal.id)}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 block">{new Date(signal.createdAt).toLocaleString()}</span>
                        <span className="text-xs text-gray-500">{signal.name}</span>
                      </div>
                    </div>
                    <SignalInfoTooltip signal={signal} />
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No signals available.</p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Note: Selected signals must have identical features to be combined.
          </p>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleRunValidation}
              disabled={selectedValidationSignalIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" /> Run Validation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ChartContainer: React.FC<{ data: any[] }> = ({ data }) => {
  const [is3D, setIs3D] = useState(false);
  return (
    <>
      <div className="absolute top-2 right-2 z-10 flex space-x-2 text-xs bg-white/80 p-1 rounded shadow-sm">
        <button
          onClick={() => setIs3D(false)}
          className={`px-2 py-1 rounded ${!is3D ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
        >
          2D
        </button>
        <button
          onClick={() => setIs3D(true)}
          className={`px-2 py-1 rounded ${is3D ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
        >
          3D
        </button>
      </div>
      {is3D ? (
        <ThreeDScatterChart data={data} />
      ) : (
        <PCAChart data={data} />
      )}
    </>
  );
};
