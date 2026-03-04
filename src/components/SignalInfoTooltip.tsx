import React from 'react';
import { Signal } from '../types';
import { Info } from 'lucide-react';

interface SignalInfoTooltipProps {
  signal: Signal;
}

export const SignalInfoTooltip: React.FC<SignalInfoTooltipProps> = ({ signal }) => {
  return (
    <div className="group relative inline-block ml-2">
      <Info className="w-4 h-4 text-gray-400 hover:text-indigo-500 cursor-help" />
      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
        <div className="space-y-1">
          <p><span className="font-semibold text-gray-300">Time Range:</span><br/>{new Date(signal.timeRange[0]).toLocaleString()} - {new Date(signal.timeRange[1]).toLocaleString()}</p>
          <p><span className="font-semibold text-gray-300">Samples:</span> {signal.data.length}</p>
          <p><span className="font-semibold text-gray-300">Features:</span><br/>{signal.features.join(', ')}</p>
          {signal.targetFeature && <p><span className="font-semibold text-gray-300">Target (y):</span><br/>{signal.targetFeature}</p>}
        </div>
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};
