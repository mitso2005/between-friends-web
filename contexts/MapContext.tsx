import React, { createContext, useState, useContext, useRef, ReactNode } from 'react';
import { TransportMode } from '../components/TransportModeSelector';
import { calculateTimeMidpoint, calculateDistanceMidpoint } from '../utils/mapCalculations';

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
  calculateMeetingPoint: () => Promise<void>;
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
  
  const calculateMeetingPoint = async () => {
    if (!coordsA || !coordsB) return;
    
    setIsCalculating(true);
    setCalculationError(null);
    setApiKeyError(false);
    
    // Calculate simple distance midpoint
    const distanceMidpoint = calculateDistanceMidpoint(coordsA, coordsB);
    setMidpoint(distanceMidpoint);
    
    try {
      // Calculate time-based midpoint
      const result = await calculateTimeMidpoint(
        coordsA,
        coordsB,
        transportModeA,
        transportModeB
      );
      
      setTimeMidpoint(result.timeMidpoint);
      setDirectionsA(result.directionsA);
      setDirectionsB(result.directionsB);
      setApiKeyError(result.apiKeyError);
      setCalculationError(result.error);
      
      // Adjust map viewport to show the routes if available
      if (map && result.directionsA && result.directionsB) {
        const bounds = new google.maps.LatLngBounds();
        
        result.directionsA.routes[0].overview_path.forEach((point) => bounds.extend(point));
        result.directionsB.routes[0].overview_path.forEach((point) => bounds.extend(point));
        
        map.fitBounds(bounds, { 
          top: 100, 
          right: 50, 
          bottom: 50, 
          left: 350 
        });
      }
    } catch (error) {
      console.error("Error in calculating meeting point:", error);
      setCalculationError("Failed to calculate meeting point.");
    } finally {
      setIsCalculating(false);
    }
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
