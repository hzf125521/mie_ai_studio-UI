import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, Rocket, Server, Clock } from 'lucide-react';
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

export const Step4: React.FC = () => {
  const { models, signals, deployedModelId, setDeployedModelId, validations } = useApp();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const readyModels = useMemo(() => {
    return models.filter(m => 
      m.status === 'completed' && 
      validations.some(v => v.modelId === m.id)
    );
  }, [models, validations]);
  
  const displayModel = useMemo(() => {
    if (selectedModelId) {
      return models.find(m => m.id === selectedModelId);
    }
    // Default to currently deployed model if exists, otherwise newest ready model
    if (deployedModelId) {
      return models.find(m => m.id === deployedModelId);
    }
    if (readyModels.length > 0) {
      return [...readyModels].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }
    return null;
  }, [selectedModelId, deployedModelId, models, readyModels]);

  const trainingSignals = useMemo(() => {
    if (!displayModel) return [];
    return signals.filter(s => displayModel.trainSignalIds?.includes(s.id));
  }, [displayModel, signals]);

  const mergedData = useMemo(() => {
    const data = trainingSignals.flatMap(s => s.data);
    
    if (displayModel?.workflow === 'regression' && displayModel.status === 'completed') {
       // Mock regression results
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

  const handleDeploy = () => {
    if (!displayModel) return;
    setIsDeploying(true);
    setTimeout(() => {
      setDeployedModelId(displayModel.id);
      setIsDeploying(false);
    }, 2000);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar: Trained Models */}
      <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" /> Ready for Deployment
        </h3>
        <ModelList 
          models={readyModels}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          displayModelId={displayModel?.id}
          deployedModelId={deployedModelId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {displayModel ? (
          <div className="w-full max-w-4xl mx-auto space-y-8">
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

            {/* Charts Removed in Step 4 as per requirement */}

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

              <button
                onClick={handleDeploy}
                disabled={isDeploying || deployedModelId === displayModel.id}
                className={cn(
                  "px-8 py-3 rounded-lg font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
                  deployedModelId === displayModel.id
                    ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 cursor-default"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
                )}
              >
                {isDeploying ? 'Deploying...' : deployedModelId === displayModel.id ? 'Deployed' : 'Deploy to Production'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Server className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Select a validated model to deploy.</p>
          </div>
        )}
      </div>
    </div>
  );
};
