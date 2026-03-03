import React, { useState } from 'react';
import { Model } from '../types';
import { cn } from '../lib/utils';
import { Clock, Edit2, Check, X, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ModelListProps {
  models: Model[];
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  displayModelId?: string; // The model currently being displayed (if different from selected, e.g. default)
  deployedModelId?: string | null;
}

export const ModelList: React.FC<ModelListProps> = ({ 
  models, 
  selectedModelId, 
  onSelectModel,
  displayModelId,
  deployedModelId
}) => {
  const { updateModel, removeModel, validations } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEditing = (model: Model) => {
    setEditingId(model.id);
    setEditName(model.name);
  };

  const saveEditing = (id: string) => {
    if (models.some(m => m.name === editName && m.id !== id)) {
      alert('Model name already exists.');
      return;
    }
    updateModel(id, { name: editName });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      removeModel(id);
      if (selectedModelId === id) {
        onSelectModel(''); // Deselect
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Model List</h3>
      <ul className="space-y-3">
        {models.map((model) => {
          const hasValidated = validations.some(v => v.modelId === model.id);
          const isDeployed = deployedModelId === model.id;

          return (
            <li
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={cn(
                'group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                (selectedModelId === model.id || (!selectedModelId && displayModelId === model.id))
                  ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                  : 'bg-gray-50 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50'
              )}
            >
              <div className="flex flex-col flex-1 min-w-0 mr-2">
                {editingId === model.id ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border border-indigo-300 rounded"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(model.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button onClick={() => saveEditing(model.id)} className="text-green-600 hover:text-green-800"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="text-sm font-medium text-gray-900 truncate" title={model.name}>{model.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEditing(model); }}
                        className="text-gray-400 hover:text-indigo-600 p-1"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(model.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  
                  {isDeployed ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Deployed
                    </span>
                  ) : hasValidated ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Validated
                    </span>
                  ) : (model.status === 'completed' && !model.isValidating) ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Trained
                    </span>
                  ) : null}
                </div>
              </div>
              {(model.status === 'training' || model.isValidating) && (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </li>
          );
        })}
        {models.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-4 italic">No models created yet.</li>
        )}
      </ul>
    </div>
  );
};
