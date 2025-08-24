import React from 'react';

type TimeFairnessPreference = 'balanced' | 'strict' | 'relaxed';

interface FairnessSelectorProps {
  preference: TimeFairnessPreference;
  setPreference: (preference: TimeFairnessPreference) => void;
}

export const FairnessSelector: React.FC<FairnessSelectorProps> = ({ 
  preference, 
  setPreference 
}) => {
  return (
    <div>
      <label className="text-sm font-medium text-title mb-1 block">
        Travel Time Fairness
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPreference("relaxed")}
          className={`flex-1 py-1.5 px-1.5 border rounded text-xs cursor-pointer flex items-center justify-center 
            ${preference === "relaxed" 
              ? "bg-accent text-white border-accent font-semibold" 
              : "bg-transparent text-gray-700 border-gray-300 font-normal"}`}
          aria-pressed={preference === "relaxed"}
        >
          Relaxed
        </button>
        <button
          type="button"
          onClick={() => setPreference("balanced")}
          className={`flex-1 py-1.5 px-1.5 border rounded text-xs cursor-pointer flex items-center justify-center 
            ${preference === "balanced" 
              ? "bg-accent text-white border-accent font-semibold" 
              : "bg-transparent text-gray-700 border-gray-300 font-normal"}`}
          aria-pressed={preference === "balanced"}
        >
          Balanced
        </button>
        <button
          type="button"
          onClick={() => setPreference("strict")}
          className={`flex-1 py-1.5 px-1.5 border rounded text-xs cursor-pointer flex items-center justify-center 
            ${preference === "strict" 
              ? "bg-accent text-white border-accent font-semibold" 
              : "bg-transparent text-gray-700 border-gray-300 font-normal"}`}
          aria-pressed={preference === "strict"}
        >
          Equal Times
        </button>
      </div>
      <div className="text-xs text-gray-600 mt-1 text-center">
        {preference === 'strict' && <span className="text-accent">(Strongly favors the slower transport mode)</span>}
        {preference === 'balanced' && <span className="text-accent">(Moderately favors the slower transport mode)</span>}
        {preference === 'relaxed' && <span className="text-accent">(Closer to geographic midpoint)</span>}
      </div>
    </div>
  );
};
