import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Signal } from '../types';
import { Info } from 'lucide-react';

interface SignalInfoTooltipProps {
  signal: Signal;
}

export const SignalInfoTooltip: React.FC<SignalInfoTooltipProps> = ({ signal }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-block ml-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Info className="w-4 h-4 text-gray-400 hover:text-indigo-500 cursor-help" />
      </div>
      {isVisible && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
          style={{
            top: coords.top - 8,
            left: coords.left,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg relative">
            <div className="space-y-1">
              <p><span className="font-semibold text-gray-300">Time Range:</span><br/>{new Date(signal.timeRange[0]).toLocaleString()} - {new Date(signal.timeRange[1]).toLocaleString()}</p>
              <p><span className="font-semibold text-gray-300">Samples:</span> {signal.data.length}</p>
              <p><span className="font-semibold text-gray-300">Features:</span><br/>{signal.features.join(', ')}</p>
              {signal.targetFeature && <p><span className="font-semibold text-gray-300">Target (y):</span><br/>{signal.targetFeature}</p>}
            </div>
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
