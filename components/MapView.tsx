import React from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useMapContext } from '../contexts/MapContext';

// Using className instead of inline style
const mapContainerClassName = "w-full h-svh";

const defaultCenter = {
  lat: -37.8136,
  lng: 144.9631,
};

interface MapViewProps {
  isLoaded: boolean;
}

export const MapView: React.FC<MapViewProps> = ({ isLoaded }) => {
  const { 
    map, 
    setMap, 
    mapBounds, 
    setMapBounds,
    updateAutocompleteBias,
    coordsA, 
    coordsB, 
    locationA,
    locationB,
    midpoint, 
    timeMidpoint, 
    directionsA, 
    directionsB, 
    apiKeyError,
    recommendedPlaces,
    selectedPlace
  } = useMapContext();
  
  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Set initial bounds for autocomplete
    const bounds = mapInstance.getBounds();
    if (bounds) {
      setMapBounds(bounds);
      updateAutocompleteBias(bounds);
    }
  };
  
  const onBoundsChanged = () => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds(bounds);
        updateAutocompleteBias(bounds);
      }
    }
  };
  
  if (!isLoaded) return <div className="text-center p-4 text-zinc-600 font-medium">Loading Maps...</div>;
  
  return (
    <GoogleMap
      mapContainerClassName={mapContainerClassName}
      center={coordsA || coordsB || defaultCenter}
      zoom={coordsA || coordsB ? 12 : 10}
      options={{
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      }}
      onLoad={onLoad}
      onBoundsChanged={onBoundsChanged}
    >
      {/* Location markers */}
      {coordsA && (
        <Marker 
          position={coordsA} 
          title={locationA}
          label={{ text: "A", color: "white" }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#525252", // Tailwind zinc-600
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        />
      )}
      {coordsB && (
        <Marker 
          position={coordsB} 
          title={locationB}
          label={{ text: "B", color: "white" }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#525252", // Tailwind zinc-600
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        />
      )}
      
      {/* Midpoint markers - completely hidden since we're auto-finding places */}
      {/* Midpoint markers are now completely hidden as we're automatically finding places */}
      
      {/* Recommended place markers */}
      {!selectedPlace && recommendedPlaces.map(place => (
        <Marker
          key={place.id}
          position={place.location}
          title={place.name}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ea580c", // Tailwind orange-600
            fillOpacity: 0.8,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        />
      ))}
      
      {/* Selected place marker */}
      {selectedPlace && (
        <Marker 
          position={selectedPlace.location}
          title={selectedPlace.name}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#ea580c", // Tailwind orange-600
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        />
      )}
      
      {/* Direction routes - only shown when a place is selected */}
      {!apiKeyError && directionsA && selectedPlace && (
        <DirectionsRenderer
          directions={directionsA}
          options={{
            polylineOptions: {
              strokeColor: "#ea580c", // Tailwind orange-600
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
            suppressMarkers: true,
          }}
        />
      )}
      
      {!apiKeyError && directionsB && selectedPlace && (
        <DirectionsRenderer
          directions={directionsB}
          options={{
            polylineOptions: {
              strokeColor: "#2563eb", // Tailwind blue-600 (correct case for v4)
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
            suppressMarkers: true,
          }}
        />
      )}
    </GoogleMap>
  );
};
