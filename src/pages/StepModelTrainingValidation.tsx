import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { Plus, Play, CheckCircle, Activity, Edit2, Trash2, Check, X, Rocket, Eye, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { PCAChart } from '../components/charts/PCAChart';
import { AnomalyChart } from '../components/charts/AnomalyChart';
import { ThreeDScatterChart } from '../components/charts/ThreeDScatterChart';
import { TrueVsPredChart } from '../components/charts/TrueVsPredChart';
import { ResidualDistributionChart } from '../components/charts/ResidualDistributionChart';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { SignalInfoTooltip } from '../components/SignalInfoTooltip';
import { ModelList } from '../components/ModelList';

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

export const StepModelTrainingValidation: React.FC = () => {
  const { 
    models, 
    signals, 
    addModel, 
    updateModel, 
    workflow,
    validations,
    addValidation,
    updateValidation,
    removeValidation,
    deployedModelId,
    setDeployedModelId
  } = useApp();

  // Tab State: 'training' or 'validation' or 'deployment'
  const [activeTab, setActiveTab] = useState<'training' | 'validation' | 'deployment'>('training');

  // ==================== DEPLOYMENT STATE ====================
  const [isDeploying, setIsDeploying] = useState(false);
  const [alarmText, setAlarmText] = useState('');
  const [showRealtimePreview, setShowRealtimePreview] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const previewIntervalRef = useRef<number | null>(null);

  const defaultAlarmText = useMemo(() => {
    const taskType = workflow === 'regression' ? 'Regression Residual' : 'Outliers Detection';
    return `AI ${taskType} 告警：检测到旋转设备运行参数异常，可能存在潜在设备故障风险。请及时检查设备状态并进行必要的维护。`;
  }, [workflow]);

  useEffect(() => {
    if (!alarmText) {
      setAlarmText(defaultAlarmText);
    }
  }, [defaultAlarmText, alarmText]);

  // ==================== TRAINING STATE ====================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [modelType, setModelType] = useState(workflow === 'regression' ? 'RandomForestRegressor' : 'Autoencoder');
  const [preprocessing, setPreprocessing] = useState({ standardization: true, pca: 0 });
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // ==================== VALIDATION STATE ====================
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [selectedValidationSignalIds, setSelectedValidationSignalIds] = useState<string[]>([]);
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);
  const [hoveredValidationId, setHoveredValidationId] = useState<string | null>(null);
  const [editingValidationId, setEditingValidationId] = useState<string | null>(null);
  const [editValidationName, setEditValidationName] = useState('');

  // Determine Display Model
  const displayModel = useMemo(() => {
    if (selectedModelId) {
      return models.find(m => m.id === selectedModelId);
    }
    if (models.length > 0) {
      return [...models].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }
    return null;
  }, [selectedModelId, models]);

  // ==================== TRAINING LOGIC ====================
  
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

  const resetTrainingForm = () => {
    setSelectedSignalIds([]);
    setModelType(workflow === 'regression' ? 'RandomForestRegressor' : 'Autoencoder');
    setPreprocessing({ standardization: true, pca: 0 });
  };

  const openNewModelModal = () => {
    resetTrainingForm();
    setIsModalOpen(true);
  };

  const handleSignalToggle = (signalId: string) => {
    if (selectedSignalIds.includes(signalId)) {
      setSelectedSignalIds(selectedSignalIds.filter(id => id !== signalId));
    } else {
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
          if (workflow === 'regression' && firstSignal.targetFeature !== targetSignal.targetFeature) {
            alert('Selected signal must have the same target feature as previously selected signals.');
            return;
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
      workflow: workflow || 'outliers',
      parameters: { ...parameters },
      preprocessing: { ...preprocessing },
      trainSignalIds: selectedSignalIds,
    };

    addModel(newModel);
    setIsModalOpen(false);
    resetTrainingForm();

    setTimeout(() => {
      const metrics = workflow === 'regression' ? {
        oobR2: 0.85 + Math.random() * 0.1,
        trainingR2: 0.90 + Math.random() * 0.08,
      } : {
        roc: 0.95 + Math.random() * 0.04,
        precision: 0.92 + Math.random() * 0.06,
      };
      updateModel(newModel.id, { status: 'completed', metrics });
    }, 3000);
  };

  const trainingSignals = useMemo(() => {
    if (!displayModel) return [];
    return signals.filter(s => displayModel.trainSignalIds?.includes(s.id));
  }, [displayModel, signals]);

  const trainingData = useMemo(() => {
    const data = trainingSignals.flatMap(s => s.data);
    if (displayModel?.workflow === 'regression' && displayModel.status === 'completed') {
      const targetFeature = trainingSignals[0]?.targetFeature;
      const std = 1.0;
      const threshold = std * 3;
      return data.map(d => {
        const trueValue = targetFeature && d[targetFeature] !== undefined ? d[targetFeature] : 0;
        const isAnomaly = d.type === 'Anomaly';
        const noise = isAnomaly ? (Math.random() > 0.5 ? 4 : -4) : (Math.random() - 0.5) * std;
        const predValue = trueValue + (isAnomaly ? 0 : noise);
        const residual = trueValue - predValue;
        const isAlarm = Math.abs(residual) > threshold;
        return { ...d, trueValue, predValue, residual, confidence: [predValue - threshold, predValue + threshold], isAlarm, targetFeature };
      });
    }
    return data;
  }, [trainingSignals, displayModel]);

  const featureImportance = useMemo(() => {
    if (displayModel?.workflow === 'regression' && trainingSignals.length > 0) {
      const features = trainingSignals[0].features;
      return { features, importance: features.map(() => Math.random()) };
    }
    return { features: [], importance: [] };
  }, [displayModel, trainingSignals]);

  // ==================== VALIDATION LOGIC ====================

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

  const validationData = useMemo(() => {
    const data = validationSignals.flatMap(s => s.data);
    if (displayModel?.workflow === 'regression') {
      const targetFeature = validationSignals[0]?.targetFeature;
      const std = 1.0;
      const threshold = std * 3;
      return data.map(d => {
        const trueValue = targetFeature && d[targetFeature] !== undefined ? d[targetFeature] : 0;
        const isAnomaly = d.type === 'Anomaly';
        const noise = isAnomaly ? (Math.random() > 0.5 ? 4 : -4) : (Math.random() - 0.5) * std;
        const predValue = trueValue + (isAnomaly ? 0 : noise);
        const residual = trueValue - predValue;
        const isAlarm = Math.abs(residual) > threshold;
        return { ...d, trueValue, predValue, residual, confidence: [predValue - threshold, predValue + threshold], isAlarm, targetFeature };
      });
    }
    return data;
  }, [validationSignals, displayModel]);

  const handleValidationSignalToggle = (signalId: string) => {
    if (selectedValidationSignalIds.includes(signalId)) {
      setSelectedValidationSignalIds(selectedValidationSignalIds.filter(id => id !== signalId));
    } else {
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
          if (displayModel.workflow === 'regression' && trainingSignal.targetFeature !== targetSignal.targetFeature) {
            alert('Selected signal must have the same target feature as the training data.');
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
    setTimeout(() => {
      const metrics = displayModel.workflow === 'regression' ? {
        oobR2: 0.82 + Math.random() * 0.1,
        trainingR2: 0.88 + Math.random() * 0.08,
      } : {
        roc: 0.90 + Math.random() * 0.08,
        precision: 0.88 + Math.random() * 0.08,
      };
      const now = new Date();
      const timeString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      let name = `Validation_${timeString}`;
      let counter = 1;
      const originalName = name;
      while (validations.some(v => v.modelId === displayModel.id && v.name === name)) {
        name = `${originalName}_${counter}`;
        counter++;
      }
      const newValidation = {
        id: `val-${Date.now()}`,
        name,
        modelId: displayModel.id,
        signalIds: selectedValidationSignalIds,
        createdAt: now.toISOString(),
        metrics,
      };
      addValidation(newValidation);
      updateModel(displayModel.id, { isValidating: false });
      setSelectedValidationSignalIds([]);
      setSelectedValidationId(newValidation.id);
    }, 2000);
  };

  const startEditingValidation = (id: string, name: string) => {
    setEditingValidationId(id);
    setEditValidationName(name);
  };

  const saveEditingValidation = (id: string) => {
    const trimmed = editValidationName.trim();
    if (!trimmed) return;
    if (modelValidations.some(v => v.name === trimmed && v.id !== id)) {
      alert('Validation name already exists.');
      return;
    }
    updateValidation(id, { name: trimmed });
    setEditingValidationId(null);
  };

  const handleDeleteValidation = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this validation?')) return;
    const nextSelected = modelValidations.filter(v => v.id !== id)[0]?.id ?? null;
    removeValidation(id);
    setSelectedValidationId(prev => (prev === id ? nextSelected : prev));
  };

  const handleToggleDeploy = () => {
    if (!displayModel) return;
    if (deployedModelId === displayModel.id) {
      setDeployedModelId(null);
      setShowRealtimePreview(false);
    } else {
      setIsDeploying(true);
      setTimeout(() => {
        setDeployedModelId(displayModel.id);
        setIsDeploying(false);
      }, 2000);
    }
  };

  // Realtime Data Simulation
  useEffect(() => {
    if (showRealtimePreview && displayModel) {
      // Initialize with some data
      const initialData = Array.from({ length: 20 }, (_, i) => generateMockPoint(i, displayModel));
      setRealtimeData(initialData);

      let counter = 20;
      previewIntervalRef.current = window.setInterval(() => {
        setRealtimeData(prev => {
          const newData = [...prev.slice(1), generateMockPoint(counter++, displayModel)];
          return newData;
        });
      }, 1000);
    } else {
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
      setRealtimeData([]);
    }

    return () => {
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, [showRealtimePreview, displayModel]);

  const generateMockPoint = (index: number, model: any) => {
    const std = 1.0;
    const threshold = std * 3;
    const isAnomaly = Math.random() > 0.9;
    const noise = isAnomaly ? (Math.random() > 0.5 ? 4 : -4) : (Math.random() - 0.5) * std;
    
    if (model.workflow === 'regression') {
       const trueValue = Math.sin(index * 0.2) * 5;
       const predValue = trueValue + (isAnomaly ? 0 : noise);
       const residual = trueValue - predValue;
       return {
         time: index,
         trueValue,
         predValue,
         residual,
         confidence: [predValue - threshold, predValue + threshold],
         isAlarm: Math.abs(residual) > threshold,
         x: Math.random() * 10,
         y: Math.random() * 10,
         z: Math.random() * 10,
       };
    } else {
      return {
        time: index,
        anomalyScore: isAnomaly ? 0.85 + Math.random() * 0.15 : Math.random() * 0.7,
        type: isAnomaly ? 'Anomaly' : 'Normal',
        x: isAnomaly ? 8 + Math.random() * 4 : Math.random() * 5,
        y: isAnomaly ? 8 + Math.random() * 4 : Math.random() * 5,
        z: isAnomaly ? 8 + Math.random() * 4 : Math.random() * 5,
      };
    }
  };

  return (
    <div className="flex h-full gap-6 flex-col">
       {/* Top Switcher */}
       <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200 w-full mb-2">
         <button
           onClick={() => setActiveTab('training')}
           className={cn(
             "flex-1 py-2 rounded-md text-sm font-medium transition-colors text-center",
             activeTab === 'training' 
               ? "bg-indigo-100 text-indigo-700 shadow-sm" 
               : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
           )}
         >
           Model Training
         </button>
         <button
           onClick={() => setActiveTab('validation')}
           className={cn(
             "flex-1 py-2 rounded-md text-sm font-medium transition-colors text-center",
             activeTab === 'validation' 
               ? "bg-indigo-100 text-indigo-700 shadow-sm" 
               : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
           )}
         >
           Model Validation
         </button>
         <button
           onClick={() => setActiveTab('deployment')}
           className={cn(
             "flex-1 py-2 rounded-md text-sm font-medium transition-colors text-center",
             activeTab === 'deployment' 
               ? "bg-indigo-100 text-indigo-700 shadow-sm" 
               : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
           )}
         >
           Model Deployment
         </button>
       </div>

       <div className="flex h-full gap-6 flex-1 min-h-0">
          {/* Left Sidebar: Model List */}
          <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
            {activeTab === 'training' ? (
              <button
                onClick={openNewModelModal}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Model
              </button>
            ) : activeTab === 'validation' ? (
               <button
                onClick={() => setIsValidationModalOpen(true)}
                disabled={!displayModel || displayModel.status !== 'completed' || !!displayModel.isValidating}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" /> New Validation
              </button>
            ) : null}

            <ModelList
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              displayModelId={displayModel?.id}
              deployedModelId={deployedModelId}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {displayModel ? (
              <div className="space-y-6">
                {activeTab === 'training' && (
                  <>
                    {displayModel.status === 'training' ? (
                      <div className="flex flex-col items-center justify-center h-96">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900">Training in Progress...</h3>
                        <p className="text-gray-500">Please wait while the model is being trained.</p>
                      </div>
                    ) : (
                      <>
                        {/* Training Info */}
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
                        {/* Training Charts */}
                        {displayModel.workflow === 'regression' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-72 flex flex-col">
                              <div className="flex-1"><TrueVsPredChart data={trainingData} targetName={trainingSignals[0]?.targetFeature || 'Target'} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <div className="flex-1"><ResidualDistributionChart data={trainingData} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <div className="flex-1"><FeatureImportanceChart features={featureImportance.features} importance={featureImportance.importance} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative"><ChartContainer data={trainingData} /></div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-72 flex flex-col">
                              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative"><ChartContainer data={trainingData} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Anomaly Score</h3>
                              <div className="flex-1"><AnomalyChart data={trainingData} threshold={0.8} /></div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {activeTab === 'validation' && (
                  <>
                    {displayModel.isValidating ? (
                      <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">Running validation...</p>
                      </div>
                    ) : displayValidation ? (
                      <>
                        {/* Validation History */}
                        {modelValidations.length > 1 && (
                          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap">History:</span>
                            {modelValidations.map((val, idx) => (
                              <div key={val.id} className="flex items-center" onMouseEnter={() => setHoveredValidationId(val.id)} onMouseLeave={() => setHoveredValidationId(null)}>
                                {editingValidationId === val.id ? (
                                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1" onClick={e => e.stopPropagation()}>
                                    <input type="text" value={editValidationName} onChange={e => setEditValidationName(e.target.value)} className="w-32 px-1 py-0.5 text-xs border border-indigo-300 rounded" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEditingValidation(val.id); if (e.key === 'Escape') setEditingValidationId(null); }} />
                                    <button onClick={() => saveEditingValidation(val.id)} className="text-green-600 hover:text-green-800"><Check className="w-3 h-3" /></button>
                                    <button onClick={() => setEditingValidationId(null)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <button onClick={() => setSelectedValidationId(val.id)} className={cn('px-3 py-1 rounded-full text-xs border transition-colors whitespace-nowrap', (displayValidation.id === val.id) ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')} title={new Date(val.createdAt).toLocaleString()}>
                                      {val.name || `#${modelValidations.length - idx}`}
                                    </button>
                                    <div className={cn('flex items-center gap-1 ml-1 transition-opacity duration-200', hoveredValidationId === val.id ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                                      <button onClick={(e) => { e.stopPropagation(); startEditingValidation(val.id, val.name); }} className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-gray-100" title="Rename"><Edit2 className="w-3 h-3" /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteValidation(val.id); }} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Validation Info Only */}
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
                                {displayModel.workflow === 'regression' ? (
                                  <>
                                    <div className="bg-white px-3 py-2 rounded border border-blue-200">
                                      <span className="text-xs text-gray-500 block">OOB R² Score</span>
                                      <span className="text-sm font-bold text-indigo-600">{displayValidation.metrics?.oobR2?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div className="bg-white px-3 py-2 rounded border border-blue-200">
                                      <span className="text-xs text-gray-500 block">Training R²</span>
                                      <span className="text-sm font-bold text-indigo-600">{displayValidation.metrics?.trainingR2?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="bg-white px-3 py-2 rounded border border-blue-200">
                                      <span className="text-xs text-gray-500 block">Validation ROC</span>
                                      <span className="text-sm font-bold text-indigo-600">{displayValidation.metrics?.roc?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                    <div className="bg-white px-3 py-2 rounded border border-blue-200">
                                      <span className="text-xs text-gray-500 block">Validation Precision</span>
                                      <span className="text-sm font-bold text-indigo-600">{displayValidation.metrics?.precision?.toFixed(4) || 'N/A'}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Validation Charts */}
                        {displayModel.workflow === 'regression' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-72 flex flex-col">
                              <div className="flex-1"><TrueVsPredChart data={validationData} targetName={validationSignals[0]?.targetFeature || 'Target'} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <div className="flex-1"><ResidualDistributionChart data={validationData} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <div className="flex-1"><FeatureImportanceChart features={featureImportance.features} importance={featureImportance.importance} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative"><ChartContainer data={validationData} /></div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-72 flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Anomaly Score vs Threshold</h3>
                              <div className="flex-1"><AnomalyChart data={validationData} threshold={0.8} /></div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative"><ChartContainer data={validationData} /></div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                       <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Activity className="w-12 h-12 mb-3 opacity-20" />
                        <p>No validation run yet.</p>
                        <p className="text-sm">Click "New Validation" to test this model.</p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'deployment' && (
                  <div className="w-full max-w-4xl mx-auto space-y-8 pt-10">
                    {showRealtimePreview ? (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setShowRealtimePreview(false)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              <Activity className="w-6 h-6 text-green-500" />
                              Real-time Monitoring: {displayModel.name}
                            </h2>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-sm font-medium text-green-600">System Active</span>
                          </div>
                        </div>

                        {displayModel.workflow === 'regression' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-72 flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Real-time True vs Predicted</h3>
                              <div className="flex-1">
                                <TrueVsPredChart data={realtimeData} targetName={trainingSignals[0]?.targetFeature || 'Target'} />
                              </div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Real-time Residuals</h3>
                              <div className="flex-1">
                                <ResidualDistributionChart data={realtimeData} />
                              </div>
                            </div>
                            <div className="h-72 flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Feature Importance (MDI)</h3>
                              <div className="flex-1">
                                <FeatureImportanceChart features={featureImportance.features} importance={featureImportance.importance} />
                              </div>
                            </div>
                            <div className="h-72 flex flex-col">
                               <h3 className="text-sm font-medium text-gray-500 mb-2">Feature Embedding Space (Live)</h3>
                               <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative">
                                 <ChartContainer data={realtimeData} />
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-80 flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Real-time Anomaly Score</h3>
                              <div className="flex-1">
                                <AnomalyChart data={realtimeData} threshold={0.8} />
                              </div>
                            </div>
                            <div className="h-80 flex flex-col">
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Feature Embedding Space (Live)</h3>
                              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden relative">
                                <ChartContainer data={realtimeData} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 text-center">
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all",
                          deployedModelId === displayModel.id ? "bg-green-100" : "bg-indigo-100"
                        )}>
                          {isDeploying ? (
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : deployedModelId === displayModel.id ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          ) : (
                            <Rocket className="w-8 h-8 text-indigo-600" />
                          )}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {deployedModelId === displayModel.id ? 'Model Deployed' : 'Deploy Model'}
                        </h2>

                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                          {deployedModelId === displayModel.id
                            ? `This model is currently running in production environment. It has been active since ${new Date().toLocaleDateString()}.`
                            : "Deploy this model to production environment. This will replace the currently active model."
                          }
                        </p>

                        <div className="mb-8 max-w-2xl mx-auto text-left">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            报警文言
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            rows={4}
                            value={alarmText}
                            onChange={(e) => setAlarmText(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-4 justify-center" title={!modelValidations.length ? "当前模型未验证，无法部署！" : ""}>
                          <button
                            onClick={handleToggleDeploy}
                            disabled={isDeploying || !modelValidations.length}
                            className={cn(
                              "px-8 py-3 rounded-lg font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
                              !modelValidations.length
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : deployedModelId === displayModel.id
                                  ? "bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
                            )}
                          >
                            {isDeploying ? 'Deploying...' : deployedModelId === displayModel.id ? 'Cancel Deployment' : 'Deploy to Production'}
                          </button>

                          {deployedModelId === displayModel.id && !isDeploying && (
                             <button
                               onClick={() => setShowRealtimePreview(true)}
                               className="px-8 py-3 rounded-lg font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500 flex items-center gap-2"
                             >
                               <Eye className="w-5 h-5" /> 实时监控预览
                             </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Plus className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">Create a new model to start training.</p>
              </div>
            )}
          </div>
       </div>

      {/* New Model Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Model">
        <div className="space-y-6">
          <Tabs tabs={['Select Signals', 'Data Preprocessing', 'Model Parameters']}>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                {signals.length > 0 ? (
                  <div className="space-y-2">
                    {signals.map((signal) => (
                      <label key={signal.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 cursor-pointer hover:bg-indigo-50">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" checked={selectedSignalIds.includes(signal.id)} onChange={() => handleSignalToggle(signal.id)} />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{new Date(signal.createdAt).toLocaleString()}</span>
                            <span className="text-xs text-gray-500">{signal.name}</span>
                          </div>
                        </div>
                        <SignalInfoTooltip signal={signal} />
                      </label>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500 text-center py-4">No signals available. Please add signals in Step 1.</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="standardization" checked={preprocessing.standardization} onChange={(e) => setPreprocessing({ ...preprocessing, standardization: e.target.checked })} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="standardization" className="text-sm font-medium text-gray-700">Enable Standardization</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PCA Components</label>
                <input type="number" min="0" value={preprocessing.pca} onChange={(e) => setPreprocessing({ ...preprocessing, pca: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Enter number of components (0 for None)" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Type</label>
                <select value={modelType} onChange={(e) => setModelType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  {workflow === 'regression' ? <option value="RandomForestRegressor">RandomForestRegressor</option> : <>
                    <option value="Autoencoder">Autoencoder</option>
                    <option value="VAE">Variational Autoencoder (VAE)</option>
                    <option value="IsolationForest">Isolation Forest</option>
                    <option value="OneClassSVM">One-Class SVM</option>
                  </>}
                </select>
              </div>
              {/* Simplified Parameters rendering for brevity - kept core inputs */}
              <div className="grid grid-cols-2 gap-4">
                 {/* Reusing the same parameter inputs as Step 2 logic... */}
                 {modelType === 'Autoencoder' && (
                  <>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Epochs</label><input type="number" value={parameters.epochs || ''} onChange={(e) => setParameters({ ...parameters, epochs: parseInt(e.target.value) })} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Batch Size</label><input type="number" value={parameters.batchSize || ''} onChange={(e) => setParameters({ ...parameters, batchSize: parseInt(e.target.value) })} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                  </>
                )}
                 {/* ... other model params ... */}
              </div>
            </div>
          </Tabs>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreateModel} disabled={selectedSignalIds.length === 0} className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Start Training</button>
          </div>
        </div>
      </Modal>

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
                      <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" checked={selectedValidationSignalIds.includes(signal.id)} onChange={() => handleValidationSignalToggle(signal.id)} />
                      <div><span className="text-sm font-medium text-gray-900 block">{new Date(signal.createdAt).toLocaleString()}</span><span className="text-xs text-gray-500">{signal.name}</span></div>
                    </div>
                    <SignalInfoTooltip signal={signal} />
                  </label>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500 text-center py-4">No signals available.</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button onClick={() => setIsValidationModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleRunValidation} disabled={selectedValidationSignalIds.length === 0} className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Run Validation</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
