import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { Plus, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { PCAChart } from '../components/charts/PCAChart';
import { AnomalyChart } from '../components/charts/AnomalyChart';
import { ThreeDScatterChart } from '../components/charts/ThreeDScatterChart';
import { TrueVsPredChart } from '../components/charts/TrueVsPredChart';
import { ResidualDistributionChart } from '../components/charts/ResidualDistributionChart';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { SignalInfoTooltip } from '../components/SignalInfoTooltip';
import { ModelList } from '../components/ModelList';

export const Step2: React.FC = () => {
  const { models, signals, addModel, updateModel, workflow } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [modelType, setModelType] = useState(workflow === 'regression' ? 'RandomForestRegressor' : 'Autoencoder');
  
  // Preprocessing State
  const [preprocessing, setPreprocessing] = useState({
    standardization: true,
    pca: 0, // 0 means None/Disabled
  });

  // Dynamic Parameters State
  const [parameters, setParameters] = useState<Record<string, any>>({});

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Set default parameters when model type changes
  useEffect(() => {
    switch (modelType) {
      case 'Autoencoder':
        setParameters({ epochs: 100, batchSize: 32, learningRate: 0.001 });
        break;
      case 'VAE':
        setParameters({ epochs: 100, batchSize: 32, learningRate: 0.001, latentDim: 2 });
        break;
      case 'IsolationForest':
        setParameters({ n_estimators: 100, contamination: 0.1 });
        break;
      case 'OneClassSVM':
        setParameters({ nu: 0.1, kernel: 'rbf', gamma: 'scale' });
        break;
      case 'RandomForestRegressor':
        setParameters({ n_estimators: 100, max_depth: 10, min_samples_split: 2 });
        break;
      default:
        setParameters({});
    }
  }, [modelType]);

  const resetForm = () => {
    setSelectedSignalIds([]);
    setModelType(workflow === 'regression' ? 'RandomForestRegressor' : 'Autoencoder');
    setPreprocessing({ standardization: true, pca: 0 });
    // Parameters reset handled by useEffect on modelType change
  };

  const openNewModelModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSignalToggle = (signalId: string) => {
    if (selectedSignalIds.includes(signalId)) {
      setSelectedSignalIds(selectedSignalIds.filter(id => id !== signalId));
    } else {
      // Check compatibility
      if (selectedSignalIds.length > 0) {
        const firstSignal = signals.find(s => s.id === selectedSignalIds[0]);
        const targetSignal = signals.find(s => s.id === signalId);
        
        if (firstSignal && targetSignal) {
          const firstFeatures = firstSignal.features.slice().sort().join(',');
          const targetFeatures = targetSignal.features.slice().sort().join(',');
          
          if (firstFeatures !== targetFeatures) {
            alert('Selected signal must have the same features as previously selected signals.');
            return;
          }

          if (workflow === 'regression') {
             if (firstSignal.targetFeature !== targetSignal.targetFeature) {
               alert('Selected signal must have the same target feature as previously selected signals.');
               return;
             }
          }
        }
      }
      setSelectedSignalIds([...selectedSignalIds, signalId]);
    }
  };

  const handleCreateModel = () => {
    if (selectedSignalIds.length === 0) {
      alert('Please select at least one signal.');
      return;
    }

    const now = new Date();
    const timeString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    let name = `Model_${timeString}`;

    // Check for duplicate name and append suffix if needed
    let counter = 1;
    let originalName = name;
    while (models.some(m => m.name === name)) {
      name = `${originalName}_${counter}`;
      counter++;
    }

    const newModel = {
      id: `model-${Date.now()}`,
      name,
      createdAt: now.toISOString(),
      status: 'training' as const,
      type: modelType,
      workflow: workflow || 'outliers', // Ensure workflow is set
      parameters: { ...parameters },
      preprocessing: { ...preprocessing },
      trainSignalIds: selectedSignalIds,
    };

    addModel(newModel);
    setIsModalOpen(false);
    resetForm();

    // Simulate training
    setTimeout(() => {
      const metrics = workflow === 'regression' ? {
        oobR2: 0.85 + Math.random() * 0.1,
        trainingR2: 0.90 + Math.random() * 0.08,
      } : {
        roc: 0.95 + Math.random() * 0.04,
        precision: 0.92 + Math.random() * 0.06,
      };

      updateModel(newModel.id, {
        status: 'completed',
        metrics,
      });
    }, 3000);
  };

  // Default to newest model if none selected
  const displayModel = useMemo(() => {
    if (selectedModelId) {
      return models.find(m => m.id === selectedModelId);
    }
    if (models.length > 0) {
      return [...models].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }
    return null;
  }, [selectedModelId, models]);

  const trainingSignals = useMemo(() => {
    if (!displayModel) return [];
    return signals.filter(s => displayModel.trainSignalIds?.includes(s.id));
  }, [displayModel, signals]);

  // Merge data for visualization (simple concatenation for demo)
  const mergedData = useMemo(() => {
    const data = trainingSignals.flatMap(s => s.data);
    
    if (displayModel?.workflow === 'regression' && displayModel.status === 'completed') {
       // Mock regression results
       const targetFeature = trainingSignals[0]?.targetFeature;
       const std = 1.0; // Mock standard deviation of residuals
       const threshold = std * 3;
       
       return data.map(d => {
         const trueValue = targetFeature && d[targetFeature] !== undefined ? d[targetFeature] : 0;
         // Mock prediction: slightly noisy version of true value
         // Add some anomalies
         const isAnomaly = d.type === 'Anomaly';
         const noise = isAnomaly ? (Math.random() > 0.5 ? 4 : -4) : (Math.random() - 0.5) * std;
         const predValue = trueValue + (isAnomaly ? 0 : noise); // Model predicts normal behavior, so true value deviates if anomaly? 
         // Wait, "True value falls outside Model Pred +/- Threshold -> Alarm"
         // If it's an anomaly in data, the model (trained on normal?) might predict "normal" value.
         // Here we assume regression model predicts "expected" value.
         // Let's say model predicts `trueValue` with small error usually.
         // If `d.type === 'Anomaly'`, let's make the residual large.
         
         // Actually, if it's a regression model trained on history, it predicts Y based on X.
         // If X is anomalous, Y might be anomalous prediction?
         // User says: "Regression Residual... based on regression model... Alarm if True Value outside Pred +/- Threshold".
         // This implies the model predicts "expected Y" given X. If "actual Y" is far from "predicted Y", it's an alarm.
         
         const residual = trueValue - predValue;
         const isAlarm = Math.abs(residual) > threshold;
         
         return {
           ...d,
           trueValue,
           predValue,
           residual,
           confidence: [predValue - threshold, predValue + threshold],
           isAlarm,
           targetFeature
         };
       });
    }
    
    return data;
  }, [trainingSignals, displayModel]);

  // Mock Feature Importance
  const featureImportance = useMemo(() => {
    if (displayModel?.workflow === 'regression' && trainingSignals.length > 0) {
      const features = trainingSignals[0].features;
      return {
        features,
        importance: features.map(() => Math.random())
      };
    }
    return { features: [], importance: [] };
  }, [displayModel, trainingSignals]);

  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar: Model List */}
      <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
        <button
          onClick={openNewModelModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Model
        </button>

        <ModelList 
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          displayModelId={displayModel?.id}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {displayModel ? (
          <div className="space-y-6">
            {displayModel.status === 'training' ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900">Training in Progress...</h3>
                <p className="text-gray-500">Please wait while the model is being trained.</p>
              </div>
            ) : (
              <>
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
                            {displayModel.workflow === 'regression' ? (
                                <>
                                    <div className="bg-white px-3 py-2 rounded border border-gray-200">
                                        <span className="text-xs text-gray-500 block">OOB R² Score</span>
                                        <span className="text-sm font-bold text-indigo-600">{displayModel.metrics?.oobR2?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div className="bg-white px-3 py-2 rounded border border-gray-200">
                                        <span className="text-xs text-gray-500 block">Training R²</span>
                                        <span className="text-sm font-bold text-indigo-600">{displayModel.metrics?.trainingR2?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white px-3 py-2 rounded border border-gray-200">
                                        <span className="text-xs text-gray-500 block">ROC Score</span>
                                        <span className="text-sm font-bold text-indigo-600">{displayModel.metrics?.roc?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div className="bg-white px-3 py-2 rounded border border-gray-200">
                                        <span className="text-xs text-gray-500 block">Precision</span>
                                        <span className="text-sm font-bold text-indigo-600">{displayModel.metrics?.precision?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                {displayModel.workflow === 'regression' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-72 flex flex-col">
                      <div className="flex-1">
                        <TrueVsPredChart data={mergedData} targetName={trainingSignals[0]?.targetFeature || 'Target'} />
                      </div>
                    </div>
                    
                    <div className="h-72 flex flex-col">
                      <div className="flex-1">
                        <ResidualDistributionChart data={mergedData} />
                      </div>
                    </div>

                    <div className="h-72 flex flex-col">
                      <div className="flex-1">
                         <FeatureImportanceChart features={featureImportance.features} importance={featureImportance.importance} />
                      </div>
                    </div>

                    <div className="h-72 flex flex-col">
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative">
                         <ChartContainer data={mergedData} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-72 flex flex-col">
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative">
                         <ChartContainer data={mergedData} />
                      </div>
                    </div>
                    
                    <div className="h-72 flex flex-col">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Anomaly Score</h3>
                        <div className="flex-1">
                          <AnomalyChart data={mergedData} threshold={0.8} />
                        </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Plus className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Create a new model to start training.</p>
          </div>
        )}
      </div>

      {/* New Model Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Model">
        <div className="space-y-6">
          <Tabs tabs={['Select Signals', 'Data Preprocessing', 'Model Parameters']}>
            {/* Select Signals Tab */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                {signals.length > 0 ? (
                  <div className="space-y-2">
                    {signals.map((signal) => (
                      <label key={signal.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 cursor-pointer hover:bg-indigo-50">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={selectedSignalIds.includes(signal.id)}
                            onChange={() => handleSignalToggle(signal.id)}
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
                  <p className="text-sm text-gray-500 text-center py-4">No signals available. Please add signals in Step 1.</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Note: Selected signals must have identical features to be combined.
              </p>
            </div>

            {/* Data Preprocessing Tab */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="standardization"
                        checked={preprocessing.standardization}
                        onChange={(e) => setPreprocessing({ ...preprocessing, standardization: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="standardization" className="text-sm font-medium text-gray-700">Enable Standardization</label>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PCA Components</label>
                    <input
                        type="number"
                        min="0"
                        value={preprocessing.pca}
                        onChange={(e) => setPreprocessing({ ...preprocessing, pca: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter number of components (0 for None)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 0 to disable PCA.</p>
                </div>
            </div>

            {/* Model Parameters Tab */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Type</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {workflow === 'regression' ? (
                    <option value="RandomForestRegressor">RandomForestRegressor</option>
                  ) : (
                    <>
                      <option value="Autoencoder">Autoencoder</option>
                      <option value="VAE">Variational Autoencoder (VAE)</option>
                      <option value="IsolationForest">Isolation Forest</option>
                      <option value="OneClassSVM">One-Class SVM</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {modelType === 'Autoencoder' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Epochs</label>
                            <input type="number" value={parameters.epochs || ''} onChange={(e) => setParameters({...parameters, epochs: parseInt(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Batch Size</label>
                            <input type="number" value={parameters.batchSize || ''} onChange={(e) => setParameters({...parameters, batchSize: parseInt(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Learning Rate</label>
                            <input type="number" step="0.0001" value={parameters.learningRate || ''} onChange={(e) => setParameters({...parameters, learningRate: parseFloat(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                    </>
                )}
                {modelType === 'VAE' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Epochs</label>
                            <input type="number" value={parameters.epochs || ''} onChange={(e) => setParameters({...parameters, epochs: parseInt(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Batch Size</label>
                            <input type="number" value={parameters.batchSize || ''} onChange={(e) => setParameters({...parameters, batchSize: parseInt(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Learning Rate</label>
                            <input type="number" step="0.0001" value={parameters.learningRate || ''} onChange={(e) => setParameters({...parameters, learningRate: parseFloat(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Latent Dim</label>
                            <input type="number" value={parameters.latentDim || ''} onChange={(e) => setParameters({...parameters, latentDim: parseInt(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                    </>
                )}
                {modelType === 'IsolationForest' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">N Estimators</label>
                            <input type="number" value={parameters.n_estimators || ''} onChange={(e) => setParameters({...parameters, n_estimators: parseInt(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Contamination</label>
                            <input type="number" step="0.01" value={parameters.contamination || ''} onChange={(e) => setParameters({...parameters, contamination: parseFloat(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                    </>
                )}
                {modelType === 'OneClassSVM' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nu</label>
                            <input type="number" step="0.01" value={parameters.nu || ''} onChange={(e) => setParameters({...parameters, nu: parseFloat(e.target.value)})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kernel</label>
                            <select value={parameters.kernel || 'rbf'} onChange={(e) => setParameters({...parameters, kernel: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm">
                                <option value="rbf">RBF</option>
                                <option value="linear">Linear</option>
                                <option value="poly">Poly</option>
                                <option value="sigmoid">Sigmoid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Gamma</label>
                            <select value={parameters.gamma || 'scale'} onChange={(e) => setParameters({...parameters, gamma: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm">
                                <option value="scale">Scale</option>
                                <option value="auto">Auto</option>
                            </select>
                        </div>
                    </>
                )}
              </div>
            </div>
          </Tabs>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleCreateModel}
              disabled={selectedSignalIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" /> Start Training
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
