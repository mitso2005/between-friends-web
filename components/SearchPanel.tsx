import React, { useState } from 'react';
import { LocationInput } from './LocationInput';
import { TransportModeSelector } from './TransportModeSelector';
import { RouteInfo } from './RouteInfo';
import { ApiKeyError, ErrorMessage } from './ErrorMessage';
import { PlaceTypeSelector } from './PlaceTypeSelector';
import { PlacesList } from './PlacesList';
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
    selectedPlaceType,
    setSelectedPlaceType,
    recommendedPlaces,
    isSearchingPlaces,
    findRecommendedPlaces,
    selectPlace,
    selectedPlace,
  } = useMapContext();

  // Track if we're in recommendation mode
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  const handleInputAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationA(e.target.value);
  };

  const handleInputBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationB(e.target.value);
  };

  const onAutocompleteLoadA = (ac: google.maps.places.Autocomplete) => {
    autocompleteA.current = ac;
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"],
    });
    if (mapBounds) ac.setBounds(mapBounds);
  };

  const onAutocompleteLoadB = (ac: google.maps.places.Autocomplete) => {
    autocompleteB.current = ac;
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"],
    });
    if (mapBounds) ac.setBounds(mapBounds);
  };

  // Handle the find meeting point flow
  const handleFindMeetingPoint = async () => {
    await calculateMeetingPoint();
    setShowRecommendations(true);
  };

  // Handle the find places flow
  const handleFindPlaces = async () => {
    await findRecommendedPlaces();
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
        💡 Find the best meeting place between two locations
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

      {coordsA && coordsB && !showRecommendations && (
        <PlaceTypeSelector 
          selectedType={selectedPlaceType}
          onTypeChange={setSelectedPlaceType}
        />
      )}

      {apiKeyError && <ApiKeyError />}
      
      {!showRecommendations ? (
        <button
          onClick={handleFindMeetingPoint}
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
      ) : (
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button
            onClick={handleFindPlaces}
            disabled={isSearchingPlaces}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#FF8C00",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: isSearchingPlaces ? "not-allowed" : "pointer",
              opacity: isSearchingPlaces ? 0.3 : 1,
            }}
          >
            {isSearchingPlaces ? "Searching..." : "Find Places"}
          </button>
          
          <button
            onClick={() => setShowRecommendations(false)}
            style={{
              padding: "10px",
              backgroundColor: "transparent",
              color: "#666",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            Back
          </button>
        </div>
      )}
      
      {calculationError && (
        <ErrorMessage message={calculationError} type="error" />
      )}

      {showRecommendations && (
        <PlacesList
          places={recommendedPlaces}
          isLoading={isSearchingPlaces}
          onPlaceSelect={selectPlace}
        />
      )}

      {selectedPlace && (
        <div style={{
          marginTop: "12px",
          padding: "10px",
          backgroundColor: "rgba(255, 140, 0, 0.1)",
          border: "1px solid rgba(255, 140, 0, 0.2)",
          borderRadius: "4px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
            Selected Place: {selectedPlace.name}
          </div>
          <div style={{ fontSize: "12px", marginBottom: "4px" }}>
            {selectedPlace.vicinity}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#FFC107", marginRight: "4px" }}>★</span>
            <span style={{ fontSize: "12px" }}>{selectedPlace.rating}</span>
            <span style={{ fontSize: "12px", color: "#666", marginLeft: "4px" }}>
              ({selectedPlace.userRatingsTotal} reviews)
            </span>
          </div>
        </div>
      )}

      {/* Display route info if available and place is selected */}
      {directionsA && directionsB && selectedPlace && (
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
