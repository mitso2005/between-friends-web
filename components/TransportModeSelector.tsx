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
      <label style={{ fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "4px", display: "block" }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setMode("DRIVING")}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: mode === "DRIVING" ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: mode === "DRIVING" ? "600" : "400",
          }}
          aria-pressed={mode === "DRIVING"}
        >
          🚗 Driving
        </button>
        <button
          type="button"
          onClick={() => setMode("TRANSIT")}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: mode === "TRANSIT" ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: mode === "TRANSIT" ? "600" : "400",
          }}
          aria-pressed={mode === "TRANSIT"}
        >
          🚌 Transit
        </button>
        <button
          type="button"
          onClick={() => setMode("WALKING")}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: mode === "WALKING" ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: mode === "WALKING" ? "600" : "400",
          }}
          aria-pressed={mode === "WALKING"}
        >
          🚶 Walking
        </button>
      </div>
    </div>
  );
};
