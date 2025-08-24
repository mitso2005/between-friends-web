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
      <label style={{ 
        fontSize: "14px", 
        fontWeight: "500", 
        color: "#666", 
        marginBottom: "4px", 
        display: "block" 
      }}>
        Travel Time Fairness
      </label>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setPreference("relaxed")}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: preference === "relaxed" ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: preference === "relaxed" ? "600" : "400",
          }}
          aria-pressed={preference === "relaxed"}
        >
          Relaxed
        </button>
        <button
          type="button"
          onClick={() => setPreference("balanced")}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: preference === "balanced" ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: preference === "balanced" ? "600" : "400",
          }}
          aria-pressed={preference === "balanced"}
        >
          Balanced
        </button>
        <button
          type="button"
          onClick={() => setPreference("strict")}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: preference === "strict" ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: preference === "strict" ? "600" : "400",
          }}
          aria-pressed={preference === "strict"}
        >
          Equal Times
        </button>
      </div>
      <div style={{ 
        fontSize: "11px", 
        color: "#666", 
        marginTop: "4px", 
        textAlign: "center" 
      }}>
        {preference === 'strict' && '(Strongly favors the slower transport mode)'}
        {preference === 'balanced' && '(Moderately favors the slower transport mode)'}
        {preference === 'relaxed' && '(Closer to geographic midpoint)'}
      </div>
    </div>
  );
};
