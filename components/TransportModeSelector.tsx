import React from 'react';

export type TransportMode = "DRIVING" | "TRANSIT" | "WALKING";

interface TransportModeSelectorProps { 
  mode: TransportMode; 
  setMode: (mode: TransportMode) => void;
  label: string;
}

export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({ 
  mode, 
  setMode, 
  label 
}) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600 mb-1 block">
        {label}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("DRIVING")}
          className={`flex-1 py-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700
            ${mode === "DRIVING" ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={mode === "DRIVING"}
        >
          🚗 Driving
        </button>
        <button
          type="button"
          onClick={() => setMode("TRANSIT")}
          className={`flex-1 py-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700
            ${mode === "TRANSIT" ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={mode === "TRANSIT"}
        >
          🚌 Transit
        </button>
        <button
          type="button"
          onClick={() => setMode("WALKING")}
          className={`flex-1 py-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700
            ${mode === "WALKING" ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={mode === "WALKING"}
        >
          🚶 Walking
        </button>
      </div>
    </div>
  );
};
