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
  const [noPlacesError, setNoPlacesError] = useState<string | null>(null);
  
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

  // Handle the find meeting point and places flow combined
  const handleFindMeetingPoint = async () => {
    // Reset errors
    setNoPlacesError(null);
    
    // Execute the entire flow in one call
    await calculateMeetingPoint((success: boolean) => {
      if (success) {
        // Only if places were found successfully
        setShowRecommendations(true);
      } else {
        // If no places found, show an error
        setNoPlacesError("No places found in this area. Try changing the place type or locations.");
        setShowRecommendations(false);
      }
    });
  };
  
  return (
    <div
      className="absolute top-6 left-6 z-10 bg-white p-4 rounded-lg shadow-md flex flex-col gap-3 min-w-[300px] max-w-[400px]"
    >
      <div className="text-xs text-grey-800 mb-2">
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
        />
      )}

      {coordsA && coordsB && !showRecommendations && (
        <div className="mt-2">
          <PlaceTypeSelector 
            selectedType={selectedPlaceType}
            onTypeChange={setSelectedPlaceType}
          />
        </div>
      )}

      {apiKeyError && <ApiKeyError />}
      
      {!showRecommendations ? (
        <button
          onClick={handleFindMeetingPoint}
          disabled={!coordsA || !coordsB || isCalculating}
          className={`mt-3 py-2.5 px-4 bg-accent text-white rounded font-semibold text-base flex items-center justify-center
            ${coordsA && coordsB && !isCalculating ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-30'}
            transition-opacity duration-200`}
        >
          {isCalculating || isSearchingPlaces ? "Finding Places..." : apiKeyError ? "Use Geographic Midpoint" : "Find Meeting Places"}
        </button>
      ) : (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowRecommendations(false)}
            className="py-2.5 px-2.5 bg-transparent text-zinc-600 border border-zinc-300 rounded text-sm"
          >
            Back
          </button>
        </div>
      )}
      
      {calculationError && (
        <ErrorMessage message={calculationError} type="error" />
      )}
      
      {noPlacesError && (
        <ErrorMessage message={noPlacesError} type="warning" />
      )}

      {showRecommendations && (
        <PlacesList
          places={recommendedPlaces}
          isLoading={isSearchingPlaces}
          onPlaceSelect={selectPlace}
        />
      )}

      {selectedPlace && (
        <div className="mt-3 p-2.5 bg-accent-light border border-accent rounded">
          <div className="text-sm text-title font-semibold mb-1">
            Selected Place: {selectedPlace.name}
          </div>
          <div className="text-xs mb-1">
            {selectedPlace.vicinity}
          </div>
          <div className="flex items-center">
            <span className="text-accent mr-1">★</span>
            <span className="text-xs">{selectedPlace.rating}</span>
            <span className="text-xs text-gray-600 ml-1">
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
        <div className="text-[10px] text-gray-600 mt-2">
          Searching in: {mapBounds.getSouthWest().lat().toFixed(3)}, {mapBounds.getSouthWest().lng().toFixed(3)} to {mapBounds.getNorthEast().lat().toFixed(3)}, {mapBounds.getNorthEast().lng().toFixed(3)}
        </div>
      )}
    </div>
  );
};