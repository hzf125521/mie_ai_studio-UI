import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Step1 } from './pages/Step1';
import { StepModelTrainingValidation } from './pages/StepModelTrainingValidation';
import { Step4 } from './pages/Step4';
import { WorkflowSelection } from './pages/WorkflowSelection';
import { DeviceSelection } from './pages/DeviceSelection';

const AppContent: React.FC = () => {
  const { currentStep } = useApp();

  if (currentStep === -1) {
    return <DeviceSelection />;
  }

  return (
    <Layout>
      {currentStep === 0 && <WorkflowSelection />}
      {currentStep === 1 && <Step1 />}
      {currentStep === 2 && <StepModelTrainingValidation />}
      {currentStep === 3 && <Step4 />}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
