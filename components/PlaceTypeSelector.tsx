import React from 'react';

export type PlaceType = 'cafe' | 'restaurant' | 'bar';

interface PlaceTypeSelectorProps {
  selectedType: PlaceType;
  onTypeChange: (type: PlaceType) => void;
}

export const PlaceTypeSelector: React.FC<PlaceTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  return (
    <div>
      <label style={{ fontSize: "14px", fontWeight: "500", color: "#666", marginBottom: "4px", display: "block" }}>
        What would you like to find?
      </label>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onTypeChange('cafe')}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: selectedType === 'cafe' ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: selectedType === 'cafe' ? "600" : "400",
          }}
          aria-pressed={selectedType === 'cafe'}
        >
          ☕ Cafe
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('restaurant')}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: selectedType === 'restaurant' ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: selectedType === 'restaurant' ? "600" : "400",
          }}
          aria-pressed={selectedType === 'restaurant'}
        >
          🍽️ Restaurant
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('bar')}
          style={{
            flex: 1,
            padding: "6px",
            backgroundColor: selectedType === 'bar' ? "#e0e0e0" : "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: selectedType === 'bar' ? "600" : "400",
          }}
          aria-pressed={selectedType === 'bar'}
        >
          🍸 Bar
        </button>
      </div>
    </div>
  );
};
