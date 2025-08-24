import React from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useMapContext } from '../contexts/MapContext';

// Using className instead of inline style
const mapContainerClassName = "w-screen h-screen";

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
  
  if (!isLoaded) return <div className="text-center p-4">Loading Maps...</div>;
  
  return (
    <GoogleMap
      mapContainerClassName={mapContainerClassName}
      center={coordsA || coordsB || defaultCenter}
      zoom={coordsA || coordsB ? 12 : 10}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
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
        />
      )}
      {coordsB && (
        <Marker 
          position={coordsB} 
          title={locationB}
          label={{ text: "B", color: "white" }}
        />
      )}
      
      {/* Midpoint markers */}
      {midpoint && !selectedPlace && (
        <Marker 
          position={midpoint}
          title="Distance Midpoint"
          label={{ text: "D", color: "white" }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#FF8C00",
            fillOpacity: 0.5,
            strokeColor: "#FFFFFF",
            strokeWeight: 1,
          }}
        />
      )}
      
      {timeMidpoint && !selectedPlace && (
        <Marker 
          position={timeMidpoint}
          title="Time Midpoint"
          label={{ text: "M", color: "white" }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#FF8C00",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
        />
      )}
      
      {/* Recommended place markers */}
      {!selectedPlace && recommendedPlaces.map(place => (
        <Marker
          key={place.id}
          position={place.location}
          title={place.name}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4CAF50", // Green color for recommended places
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
            fillColor: "#4CAF50", // Green color for the selected place
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
              strokeColor: "#1976D2",
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
              strokeColor: "#D32F2F",
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
