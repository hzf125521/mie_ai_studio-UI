import React from 'react';
import { Model, Signal } from '../types';

interface ModelDetailsHeaderProps {
  model: Model;
  signal?: Signal;
}

export const ModelDetailsHeader: React.FC<ModelDetailsHeaderProps> = ({ model, signal }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
        Model Training Information
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="block text-xs text-gray-500 uppercase">Model Name</span>
          <span className="font-medium text-gray-900">{model.name}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 uppercase">Model Type</span>
          <span className="font-medium text-gray-900">{model.type}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 uppercase">Training Signal</span>
          <span className="font-medium text-gray-900">{signal?.name || 'Unknown'}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 uppercase">Preprocessing</span>
          <span className="font-medium text-gray-900">{model.parameters.preprocessing}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 uppercase">PCA Config</span>
          <span className="font-medium text-gray-900">{model.parameters.pcaConfig}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 uppercase">ROC (Train)</span>
          <span className="font-medium text-gray-900">{model.metrics?.roc?.toFixed(3) ?? '-'}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 uppercase">Precision (Train)</span>
          <span className="font-medium text-gray-900">{model.metrics?.precision?.toFixed(3) ?? '-'}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-500 uppercase">Status</span>
          <span className={`font-medium ${model.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
            {model.status}
          </span>
        </div>
      </div>
    </div>
  );
};
