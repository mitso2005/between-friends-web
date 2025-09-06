import React, { createContext, useState, useContext, useRef, ReactNode } from 'react';
import { TransportMode } from '../components/TransportModeSelector';
import { Place } from '../components/PlacesList';
import { PlaceType } from '../components/PlaceTypeSelector';
import { 
  calculateTimeMidpoint, 
  calculateDistanceMidpoint,
  findNearbyPlaces,
  getSearchRadius,
  getRouteToPlace
} from '../utils/mapCalculations';

interface MapContextType {
  // Map state
  map: google.maps.Map | null;
  mapBounds: google.maps.LatLngBounds | null;
  
  // Location data
  locationA: string;
  locationB: string;
  coordsA: google.maps.LatLngLiteral | null;
  coordsB: google.maps.LatLngLiteral | null;
  
  // Transport modes
  transportModeA: TransportMode;
  transportModeB: TransportMode;
  
  // Calculation results
  midpoint: google.maps.LatLngLiteral | null; // Distance midpoint
  timeMidpoint: google.maps.LatLngLiteral | null; // Time-based midpoint
  directionsA: google.maps.DirectionsResult | null;
  directionsB: google.maps.DirectionsResult | null;
  
  // Status indicators
  isCalculating: boolean;
  apiKeyError: boolean;
  calculationError: string | null;
  
  // Autocomplete refs
  autocompleteA: React.RefObject<google.maps.places.Autocomplete | null>;
  autocompleteB: React.RefObject<google.maps.places.Autocomplete | null>;
  
  // Place-related state
  selectedPlaceType: PlaceType;
  recommendedPlaces: Place[];
  selectedPlace: Place | null;
  isSearchingPlaces: boolean;
  
  // Actions
  setMap: (map: google.maps.Map | null) => void;
  setMapBounds: (bounds: google.maps.LatLngBounds | null) => void;
  setLocationA: (location: string) => void;
  setLocationB: (location: string) => void;
  setCoordsA: (coords: google.maps.LatLngLiteral | null) => void;
  setCoordsB: (coords: google.maps.LatLngLiteral | null) => void;
  setTransportModeA: (mode: TransportMode) => void;
  setTransportModeB: (mode: TransportMode) => void;
  updateAutocompleteBias: (bounds: google.maps.LatLngBounds) => void;
  onPlaceChangedA: () => void;
  onPlaceChangedB: () => void;
  calculateMeetingPoint: (onComplete?: (success: boolean) => void) => Promise<void>;
  setSelectedPlaceType: (type: PlaceType) => void;
  findRecommendedPlaces: (onComplete?: (success: boolean) => void) => Promise<void>;
  selectPlace: (place: Place) => Promise<void>;
  clearSelectedPlace: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [locationA, setLocationA] = useState<string>("");
  const [locationB, setLocationB] = useState<string>("");
  const [coordsA, setCoordsA] = useState<google.maps.LatLngLiteral | null>(null);
  const [coordsB, setCoordsB] = useState<google.maps.LatLngLiteral | null>(null);
  const [transportModeA, setTransportModeA] = useState<TransportMode>("DRIVING");
  const [transportModeB, setTransportModeB] = useState<TransportMode>("DRIVING");
  const [midpoint, setMidpoint] = useState<google.maps.LatLngLiteral | null>(null);
  const [timeMidpoint, setTimeMidpoint] = useState<google.maps.LatLngLiteral | null>(null);
  const [directionsA, setDirectionsA] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsB, setDirectionsB] = useState<google.maps.DirectionsResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  
  // Refs
  const autocompleteA = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteB = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Place-related state
  const [selectedPlaceType, setSelectedPlaceType] = useState<PlaceType>('restaurant');
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
  
  // Helper functions
  const updateAutocompleteBias = (bounds: google.maps.LatLngBounds) => {
    if (autocompleteA.current) {
      autocompleteA.current.setBounds(bounds);
    }
    if (autocompleteB.current) {
      autocompleteB.current.setBounds(bounds);
    }
  };
  
  const onPlaceChangedA = () => {
    if (autocompleteA.current) {
      const place = autocompleteA.current.getPlace();
      if (place.geometry?.location) {
        const newCoords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCoordsA(newCoords);
        setLocationA(place.formatted_address || place.name || "");
        
        // Pan map to show the new location
        if (map) {
          map.panTo(newCoords);
        }
      }
    }
  };

  const onPlaceChangedB = () => {
    if (autocompleteB.current) {
      const place = autocompleteB.current.getPlace();
      if (place.geometry?.location) {
        const newCoords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCoordsB(newCoords);
        setLocationB(place.formatted_address || place.name || "");
        
        // Pan map to show the new location
        if (map) {
          map.panTo(newCoords);
        }
      }
    }
  };
  
  const calculateMeetingPoint = async (onComplete?: (success: boolean) => void) => {
    if (!coordsA || !coordsB) {
      if (onComplete) onComplete(false);
      return;
    }
    
    setIsCalculating(true);
    setCalculationError(null);
    setApiKeyError(false);
    
    try {
      // Calculate simple distance midpoint - but don't show it to the user
      const distanceMidpoint = calculateDistanceMidpoint(coordsA, coordsB);
      
      // Store the midpoint internally but don't display it
      setMidpoint(null); // Don't show midpoint visually
      
      // Calculate time-based midpoint
      const result = await calculateTimeMidpoint(
        coordsA,
        coordsB,
        transportModeA,
        transportModeB
      );
      
      // Store the results internally
      setTimeMidpoint(result.timeMidpoint);
      setDirectionsA(result.directionsA);
      setDirectionsB(result.directionsB);
      setApiKeyError(result.apiKeyError);
      setCalculationError(result.error);
      
      if (result.apiKeyError || result.error) {
        if (onComplete) onComplete(false);
        return;
      }
      
      // Proceed to finding places immediately
      try {
        setIsSearchingPlaces(true);
        setRecommendedPlaces([]);
        
        // Determine search radius based on transport modes
        const radius = getSearchRadius(transportModeA, transportModeB);
        
        // Find places using the time midpoint
        const places = await findNearbyPlaces(result.timeMidpoint, selectedPlaceType, radius);
        setRecommendedPlaces(places);
        
        // Adjust map viewport to show the places and routes
        if (map && places.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          
          // Include the start/end locations
          bounds.extend(coordsA);
          bounds.extend(coordsB);
          
          // Include all the places found
          places.forEach(place => bounds.extend(place.location));
          
          map.fitBounds(bounds, { 
            top: 100, 
            right: 50, 
            bottom: 50, 
            left: 350 
          });
        }
        
        // Report success/failure to the caller
        if (onComplete) onComplete(places.length > 0);
        
      } catch (error) {
        console.error("Error finding recommended places:", error);
        if (onComplete) onComplete(false);
      } finally {
        setIsSearchingPlaces(false);
      }
      
    } catch (error) {
      console.error("Error in calculating meeting point:", error);
      setCalculationError("Failed to calculate meeting point.");
      if (onComplete) onComplete(false);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Find recommended places near the midpoint
  // This function is now primarily used separately for finding different place types
  // after the midpoint has already been calculated
  const findRecommendedPlaces = async (onComplete?: (success: boolean) => void) => {
    if (!timeMidpoint) {
      if (onComplete) onComplete(false);
      return;
    }
    
    setIsSearchingPlaces(true);
    setRecommendedPlaces([]);
    
    try {
      // Determine search radius based on transport modes
      const radius = getSearchRadius(transportModeA, transportModeB);
      
      // Find places
      const places = await findNearbyPlaces(timeMidpoint, selectedPlaceType, radius);
      setRecommendedPlaces(places);
      
      if (onComplete) onComplete(places.length > 0);
    } catch (error) {
      console.error("Error finding recommended places:", error);
      if (onComplete) onComplete(false);
    } finally {
      setIsSearchingPlaces(false);
    }
  };
  
  // Select a place and calculate routes to it
  const selectPlace = async (place: Place) => {
    if (!coordsA || !coordsB) return;
    
    setSelectedPlace(place);
    setIsCalculating(true);
    
    try {
      // Get routes from both locations to the selected place
      const [routeA, routeB] = await Promise.all([
        getRouteToPlace(coordsA, place.location, transportModeA),
        getRouteToPlace(coordsB, place.location, transportModeB),
      ]);
      
      if (routeA && routeB) {
        // Examine route times to see if they're fair
        const timeA = routeA.routes[0].legs[0].duration?.value || 0;
        const timeB = routeB.routes[0].legs[0].duration?.value || 0;
        const timeDiff = Math.abs(timeA - timeB);
        
        // If times are very different, warn the user but still show the place
        if (timeDiff > 300) { // More than 5 minutes difference
          setCalculationError(`Note: Travel times to this place differ by ${Math.round(timeDiff/60)} minutes`);
        } else {
          setCalculationError(null);
        }
      }
      
      setDirectionsA(routeA);
      setDirectionsB(routeB);
      
      // Adjust map to show both routes
      if (map && routeA && routeB) {
        const bounds = new google.maps.LatLngBounds();
        routeA.routes[0].overview_path.forEach(point => bounds.extend(point));
        routeB.routes[0].overview_path.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, { top: 100, right: 50, bottom: 50, left: 350 });
      }
    } catch (error) {
      console.error("Error getting routes to selected place:", error);
      setCalculationError("Could not calculate routes to this place.");
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Clear selected place
  const clearSelectedPlace = () => {
    setSelectedPlace(null);
    // Keep the directions if needed or clear them
    // setDirectionsA(null);
    // setDirectionsB(null);
  };
  
  // Context value
  const value: MapContextType = {
    map,
    mapBounds,
    locationA,
    locationB,
    coordsA,
    coordsB,
    transportModeA,
    transportModeB,
    midpoint,
    timeMidpoint,
    directionsA,
    directionsB,
    isCalculating,
    apiKeyError,
    calculationError,
    autocompleteA,
    autocompleteB,
    selectedPlaceType,
    recommendedPlaces,
    selectedPlace,
    isSearchingPlaces,
    setMap,
    setMapBounds,
    setLocationA,
    setLocationB,
    setCoordsA,
    setCoordsB,
    setTransportModeA,
    setTransportModeB,
    updateAutocompleteBias,
    onPlaceChangedA,
    onPlaceChangedB,
    calculateMeetingPoint,
    setSelectedPlaceType,
    findRecommendedPlaces,
    selectPlace,
    clearSelectedPlace,
  };
  
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// Custom hook to use the map context
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};