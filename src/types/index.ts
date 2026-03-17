export interface Signal {
  id: string;
  name: string;
  createdAt: string; // ISO string
  timeRange: [string, string];
  features: string[];
  targetFeature?: string; // For regression
  data: any[]; // Mock data for charts
  workflow?: WorkflowType;
  deviceId?: string;
}

export type WorkflowType = 'outliers' | 'regression';

export interface Device {
  id: string;
  name: string;
  code: string;
}

export interface Model {
  id: string;
  name: string;
  deviceId?: string;
  createdAt: string;
  status: 'training' | 'completed' | 'failed';
  type: string;
  workflow: WorkflowType;
  parameters: Record<string, any>;
  preprocessing: {
    standardization: boolean;
    pca: number;
  };
  metrics?: {
    roc?: number;
    precision?: number;
    oobR2?: number; // Regression
    trainingR2?: number; // Regression
  };
  trainSignalIds: string[]; // Changed from trainSignalId
  isValidating?: boolean;
}

export interface Validation {
  id: string;
  name: string;
  modelId: string;
  signalIds: string[]; // Changed from signalId
  createdAt: string;
  metrics: {
    roc?: number;
    precision?: number;
    oobR2?: number;
    trainingR2?: number;
  };
  workflow?: WorkflowType;
}
