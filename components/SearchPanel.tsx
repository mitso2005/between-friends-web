import React from 'react';
import { LocationInput } from './LocationInput';
import { TransportModeSelector, TransportMode } from './TransportModeSelector';
import { RouteInfo } from './RouteInfo';
import { ApiKeyError, ErrorMessage } from './ErrorMessage';

interface SearchPanelProps {
  locationA: string;
  locationB: string;
  handleInputAChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceChangedA: () => void;
  onPlaceChangedB: () => void;
  onAutocompleteLoadA: (autocomplete: google.maps.places.Autocomplete) => void;
  onAutocompleteLoadB: (autocomplete: google.maps.places.Autocomplete) => void;
  coordsA: google.maps.LatLngLiteral | null;
  coordsB: google.maps.LatLngLiteral | null;
  transportModeA: TransportMode;
  transportModeB: TransportMode;
  setTransportModeA: (mode: TransportMode) => void;
  setTransportModeB: (mode: TransportMode) => void;
  apiKeyError: boolean;
  calculationError: string | null;
  isCalculating: boolean;
  calculateTimeMidpoint: () => void;
  directionsA: google.maps.DirectionsResult | null;
  directionsB: google.maps.DirectionsResult | null;
  timeMidpoint: google.maps.LatLngLiteral | null;
  mapBounds: google.maps.LatLngBounds | null;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  locationA,
  locationB,
  handleInputAChange,
  handleInputBChange,
  onPlaceChangedA,
  onPlaceChangedB,
  onAutocompleteLoadA,
  onAutocompleteLoadB,
  coordsA,
  coordsB,
  transportModeA,
  transportModeB,
  setTransportModeA,
  setTransportModeB,
  apiKeyError,
  calculationError,
  isCalculating,
  calculateTimeMidpoint,
  directionsA,
  directionsB,
  timeMidpoint,
  mapBounds,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        zIndex: 10,
        background: "rgba(255,255,255,0.95)",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minWidth: "300px",
        maxWidth: "400px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
        💡 Suggestions are based on the current map view (works worldwide)
      </div>
      
      <LocationInput
        label="First Location"
        placeholder="Enter first location"
        value={locationA}
        onChange={handleInputAChange}
        onPlaceChanged={onPlaceChangedA}
        onAutocompleteLoad={onAutocompleteLoadA}
        id="location-input-a"
      />
      
      {/* Transport mode selector for location A */}
      {coordsA && (
        <TransportModeSelector 
          mode={transportModeA} 
          setMode={setTransportModeA} 
          label="Transport mode from first location:"
        />
      )}
      
      <LocationInput
        label="Second Location"
        placeholder="Enter second location"
        value={locationB}
        onChange={handleInputBChange}
        onPlaceChanged={onPlaceChangedB}
        onAutocompleteLoad={onAutocompleteLoadB}
        id="location-input-b"
      />
      
      {/* Transport mode selector for location B */}
      {coordsB && (
        <TransportModeSelector 
          mode={transportModeB} 
          setMode={setTransportModeB} 
          label="Transport mode from second location:"
        />
      )}

      {/* API Key Error Message */}
      {apiKeyError && <ApiKeyError />}
      
      {/* Calculate Midpoint Button */}
      <button
        onClick={calculateTimeMidpoint}
        disabled={!coordsA || !coordsB || isCalculating}
        style={{
          marginTop: "12px",
          padding: "10px 16px",
          backgroundColor: "#FF8C00", // Orange color
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontWeight: "600",
          fontSize: "16px",
          cursor: coordsA && coordsB && !isCalculating ? "pointer" : "not-allowed",
          opacity: coordsA && coordsB && !isCalculating ? 1 : 0.3,
          transition: "opacity 0.2s ease-in-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isCalculating ? "Calculating..." : apiKeyError ? "Use Geographic Midpoint" : "Find Meeting Point"}
      </button>
      
      {calculationError && (
        <ErrorMessage message={calculationError} type="error" />
      )}

      {/* Display route info if available */}
      {directionsA && directionsB && timeMidpoint && (
        <RouteInfo 
          directionsA={directionsA}
          directionsB={directionsB}
          transportModeA={transportModeA}
          transportModeB={transportModeB}
        />
      )}

      {/* Debug info showing current map bounds */}
      {mapBounds && (
        <div style={{ fontSize: "10px", color: "#888", marginTop: "8px" }}>
          Searching in: {mapBounds.getSouthWest().lat().toFixed(3)}, {mapBounds.getSouthWest().lng().toFixed(3)} to {mapBounds.getNorthEast().lat().toFixed(3)}, {mapBounds.getNorthEast().lng().toFixed(3)}
        </div>
      )}
    </div>
  );
};
