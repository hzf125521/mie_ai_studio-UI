import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Signal, Model, Validation, WorkflowType, Device } from '../types';

interface AppContextType {
  devices: Device[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  signals: Signal[];
  addSignal: (signal: Signal) => void;
  removeSignal: (id: string) => void;
  models: Model[];
  addModel: (model: Model) => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  removeModel: (id: string) => void;
  validations: Validation[];
  addValidation: (validation: Validation) => void;
  updateValidation: (id: string, updates: Partial<Validation>) => void;
  removeValidation: (id: string) => void;
  deployedModelId: string | null;
  setDeployedModelId: (id: string | null) => void;
  deployModel: (deviceId: string, workflow: WorkflowType, modelId: string) => void;
  undeployModel: (deviceId: string, workflow: WorkflowType) => void;
  currentStep: number;
  setStep: (step: number) => void;
  workflow: WorkflowType | null;
  setWorkflow: (workflow: WorkflowType | null) => void;
  updateSignal: (id: string, updates: Partial<Signal>) => void;
  // Expose raw models for the device list page
  allModels: Model[];
  allValidations: Validation[];
  deployedModels: Record<string, string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [currentStep, setStep] = useState(-1); // Start at -1 for device selection
  const [deployedModels, setDeployedModels] = useState<Record<string, string | null>>({});
  const [workflow, setWorkflow] = useState<WorkflowType | null>(null);

  // Derived state for current workflow
  const deployedModelId = useMemo(() => {
    if (workflow && selectedDeviceId) {
      return deployedModels[`${selectedDeviceId}_${workflow}`] || null;
    }
    return null;
  }, [deployedModels, workflow, selectedDeviceId]);

  const setDeployedModelId = (id: string | null) => {
    if (workflow && selectedDeviceId) {
      setDeployedModels(prev => ({ ...prev, [`${selectedDeviceId}_${workflow}`]: id }));
    }
  };

  const deployModel = (deviceId: string, workflow: WorkflowType, modelId: string) => {
    setDeployedModels(prev => ({ ...prev, [`${deviceId}_${workflow}`]: modelId }));
  };

  const undeployModel = (deviceId: string, workflow: WorkflowType) => {
    setDeployedModels(prev => ({ ...prev, [`${deviceId}_${workflow}`]: null }));
  };

  // Mock initial data
  useEffect(() => {
    // Add mock devices
    setDevices([
      { id: 'dev-1', name: 'Pump Station A', code: 'PSA-001' },
      { id: 'dev-2', name: 'Compressor Unit B', code: 'CUB-002' },
    ]);

    // Add some initial mock signals
    const mockSignal: Signal = {
      id: 'sig-1',
      name: 'Signal_20230101_1200',
      createdAt: '2023-01-01T12:00:00.000Z',
      timeRange: ['2023-01-01T00:00', '2023-01-02T00:00'],
      features: ['PointA_Temp', 'PointA_Pressure'],
      targetFeature: 'PointA_Temp', // Default target for regression
      workflow: 'outliers', // Default to outliers for mock
      deviceId: 'dev-1',
      data: Array.from({ length: 50 }, (_, i) => ({
        time: i,
        PointA_Temp: Math.sin(i * 0.2) + Math.random() * 0.2,
        PointA_Pressure: Math.cos(i * 0.2) + Math.random() * 0.2,
        x: Math.random() * 10,
        y: Math.random() * 10,
        z: Math.random() * 10,
        anomalyScore: Math.random(),
        type: Math.random() > 0.9 ? 'Anomaly' : 'Normal',
      })),
    };
    setSignals([mockSignal]);
  }, []);

  const filteredSignals = useMemo(() => {
    if (!workflow || !selectedDeviceId) return [];
    return signals.filter(s => s.workflow === workflow && s.deviceId === selectedDeviceId);
  }, [signals, workflow, selectedDeviceId]);

  const filteredModels = useMemo(() => {
    if (!workflow || !selectedDeviceId) return [];
    return models.filter(m => m.workflow === workflow && m.deviceId === selectedDeviceId);
  }, [models, workflow, selectedDeviceId]);

  const filteredValidations = useMemo(() => {
    if (!workflow || !selectedDeviceId) return [];
    // Validations are linked to models, so if models are filtered, validations implicitly are too?
    // But validation object doesn't have deviceId directly, it has modelId.
    // So we filter by modelId.
    const validModelIds = new Set(filteredModels.map(m => m.id));
    return validations.filter(v => validModelIds.has(v.modelId));
  }, [validations, filteredModels]);

  const addSignal = (signal: Signal) => setSignals((prev) => [...prev, { ...signal, workflow: workflow || 'outliers', deviceId: selectedDeviceId || undefined }]);
  const updateSignal = (id: string, updates: Partial<Signal>) => {
    setSignals((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };
  const removeSignal = (id: string) => setSignals((prev) => prev.filter((s) => s.id !== id));

  const addModel = (model: Model) => setModels((prev) => [...prev, { ...model, workflow: workflow || 'outliers', deviceId: selectedDeviceId || undefined }]);
  const updateModel = (id: string, updates: Partial<Model>) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };
  const removeModel = (id: string) => setModels((prev) => prev.filter((m) => m.id !== id));

  const addValidation = (validation: Validation) => setValidations((prev) => [...prev, { ...validation, workflow: workflow || 'outliers' }]);
  const updateValidation = (id: string, updates: Partial<Validation>) => {
    setValidations((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };
  const removeValidation = (id: string) => setValidations((prev) => prev.filter((v) => v.id !== id));

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    signals: filteredSignals,
    addSignal,
    removeSignal,
    models: filteredModels,
    addModel,
    updateModel,
    removeModel,
    validations: filteredValidations,
    addValidation,
    updateValidation,
    removeValidation,
    deployedModelId,
    setDeployedModelId,
    deployModel,
    undeployModel,
    currentStep,
    setStep,
    workflow,
    setWorkflow,
    updateSignal,
    allModels: models, // Expose all models for the device list page
    allValidations: validations,
    deployedModels,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
