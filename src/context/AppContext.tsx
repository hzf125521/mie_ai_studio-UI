import React, { createContext, useContext, useState, useEffect } from 'react';
import { Signal, Model, Validation } from '../types';

interface AppContextType {
  signals: Signal[];
  addSignal: (signal: Signal) => void;
  removeSignal: (id: string) => void;
  models: Model[];
  addModel: (model: Model) => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  removeModel: (id: string) => void;
  validations: Validation[];
  addValidation: (validation: Validation) => void;
  removeValidation: (id: string) => void;
  deployedModelId: string | null;
  setDeployedModelId: (id: string | null) => void;
  currentStep: number;
  setStep: (step: number) => void;
  updateSignal: (id: string, updates: Partial<Signal>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [currentStep, setStep] = useState(1);
  const [deployedModelId, setDeployedModelId] = useState<string | null>(null);

  // Mock initial data
  useEffect(() => {
    // Add some initial mock signals
    const mockSignal: Signal = {
      id: 'sig-1',
      name: 'Signal_20230101_1200',
      createdAt: '2023-01-01T12:00:00.000Z',
      timeRange: ['2023-01-01T00:00', '2023-01-02T00:00'],
      features: ['PointA_Temp', 'PointA_Pressure'],
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

  const addSignal = (signal: Signal) => setSignals((prev) => [...prev, signal]);
  const updateSignal = (id: string, updates: Partial<Signal>) => {
    setSignals((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };
  const removeSignal = (id: string) => setSignals((prev) => prev.filter((s) => s.id !== id));

  const addModel = (model: Model) => setModels((prev) => [...prev, model]);
  const updateModel = (id: string, updates: Partial<Model>) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };
  const removeModel = (id: string) => setModels((prev) => prev.filter((m) => m.id !== id));

  const addValidation = (validation: Validation) => setValidations((prev) => [...prev, validation]);
  const removeValidation = (id: string) => setValidations((prev) => prev.filter((v) => v.id !== id));

  return (
    <AppContext.Provider
      value={{
        signals,
        addSignal,
        updateSignal,
        removeSignal,
        models,
        addModel,
        updateModel,
        removeModel,
        validations,
        addValidation,
        removeValidation,
        deployedModelId,
        setDeployedModelId,
        currentStep,
        setStep,
      }}
    >
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
