export interface Signal {
  id: string;
  name: string;
  createdAt: string; // ISO string
  timeRange: [string, string];
  features: string[];
  data: any[]; // Mock data for charts
}

export interface Model {
  id: string;
  name: string;
  createdAt: string;
  status: 'training' | 'completed' | 'failed';
  type: string;
  parameters: Record<string, any>;
  preprocessing: {
    standardization: boolean;
    pca: number;
  };
  metrics?: {
    roc: number;
    precision: number;
  };
  trainSignalIds: string[]; // Changed from trainSignalId
  isValidating?: boolean;
}

export interface Validation {
  id: string;
  modelId: string;
  signalIds: string[]; // Changed from signalId
  createdAt: string;
  metrics: {
    roc: number;
    precision: number;
  };
}
