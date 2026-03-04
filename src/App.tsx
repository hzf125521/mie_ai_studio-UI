import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Step1 } from './pages/Step1';
import { Step2 } from './pages/Step2';
import { Step3 } from './pages/Step3';
import { Step4 } from './pages/Step4';
import { WorkflowSelection } from './pages/WorkflowSelection';

const AppContent: React.FC = () => {
  const { currentStep } = useApp();

  if (currentStep === 0) {
    return <WorkflowSelection />;
  }

  return (
    <Layout>
      {currentStep === 1 && <Step1 />}
      {currentStep === 2 && <Step2 />}
      {currentStep === 3 && <Step3 />}
      {currentStep === 4 && <Step4 />}
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
