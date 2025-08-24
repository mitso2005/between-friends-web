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
      <label className="text-sm font-medium text-gray-600 mb-1 block">
        Travel Time Fairness
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPreference("relaxed")}
          className={`flex-1 py-1.5 px-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700 
            ${preference === "relaxed" ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={preference === "relaxed"}
        >
          Relaxed
        </button>
        <button
          type="button"
          onClick={() => setPreference("balanced")}
          className={`flex-1 py-1.5 px-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700 
            ${preference === "balanced" ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={preference === "balanced"}
        >
          Balanced
        </button>
        <button
          type="button"
          onClick={() => setPreference("strict")}
          className={`flex-1 py-1.5 px-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700 
            ${preference === "strict" ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={preference === "strict"}
        >
          Equal Times
        </button>
      </div>
      <div className="text-xs text-gray-600 mt-1 text-center">
        {preference === 'strict' && '(Strongly favors the slower transport mode)'}
        {preference === 'balanced' && '(Moderately favors the slower transport mode)'}
        {preference === 'relaxed' && '(Closer to geographic midpoint)'}
      </div>
    </div>
  );
};
