import React from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { CheckCircle, Circle } from 'lucide-react';

const steps = [
  { id: 1, title: 'Step 1: Signal Preparation' },
  { id: 2, title: 'Step 2: Model Training' },
  { id: 3, title: 'Step 3: Model Validation' },
  { id: 4, title: 'Step 4: Model Deployment' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentStep, setStep } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">ML Workflow</span>
            </div>
            <nav className="flex space-x-8">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setStep(step.id)}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    currentStep === step.id
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Circle className={cn("w-4 h-4 mr-2", currentStep === step.id ? "fill-indigo-600 text-indigo-600" : "text-gray-400")} />
                  )}
                  {step.title}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
