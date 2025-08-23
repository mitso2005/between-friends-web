import React from 'react';
import { LocationInput } from './LocationInput';
import { TransportModeSelector } from './TransportModeSelector';
import { RouteInfo } from './RouteInfo';
import { ApiKeyError, ErrorMessage } from './ErrorMessage';
import { useMapContext } from '../contexts/MapContext';

export const SearchPanel: React.FC = () => {
  const {
    locationA,
    locationB,
    setLocationA,
    setLocationB,
    coordsA,
    coordsB,
    transportModeA,
    transportModeB,
    setTransportModeA,
    setTransportModeB,
    autocompleteA,
    autocompleteB,
    onPlaceChangedA,
    onPlaceChangedB,
    apiKeyError,
    calculationError,
    isCalculating,
    calculateMeetingPoint,
    directionsA,
    directionsB,
    timeMidpoint,
    mapBounds,
  } = useMapContext();
  
  const handleInputAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationA(e.target.value);
  };

  const handleInputBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationB(e.target.value);
  };

  const onAutocompleteLoadA = (ac: google.maps.places.Autocomplete) => {
    autocompleteA.current = ac;
    
    // Set initial autocomplete options
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"],
    });

    // Apply current map bounds if available
    if (mapBounds) {
      ac.setBounds(mapBounds);
    }
  };

  const onAutocompleteLoadB = (ac: google.maps.places.Autocomplete) => {
    autocompleteB.current = ac;
    
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"],
    });

    if (mapBounds) {
      ac.setBounds(mapBounds);
    }
  };
  
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
      
      {coordsB && (
        <TransportModeSelector 
          mode={transportModeB} 
          setMode={setTransportModeB} 
          label="Transport mode from second location:"
        />
      )}

      {apiKeyError && <ApiKeyError />}
      
      <button
        onClick={calculateMeetingPoint}
        disabled={!coordsA || !coordsB || isCalculating}
        style={{
          marginTop: "12px",
          padding: "10px 16px",
          backgroundColor: "#FF8C00",
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

      {directionsA && directionsB && timeMidpoint && (
        <RouteInfo 
          directionsA={directionsA}
          directionsB={directionsB}
          transportModeA={transportModeA}
          transportModeB={transportModeB}
        />
      )}

      {mapBounds && (
        <div style={{ fontSize: "10px", color: "#888", marginTop: "8px" }}>
          Searching in: {mapBounds.getSouthWest().lat().toFixed(3)}, {mapBounds.getSouthWest().lng().toFixed(3)} to {mapBounds.getNorthEast().lat().toFixed(3)}, {mapBounds.getNorthEast().lng().toFixed(3)}
        </div>
      )}
    </div>
  );
};
