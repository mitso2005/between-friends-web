import React from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useMapContext } from '../contexts/MapContext';

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

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
    apiKeyError 
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
  
  if (!isLoaded) return <div>Loading Maps...</div>;
  
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
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
      {/* Original markers for debugging */}
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
      {midpoint && (
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
      
      {/* Time-based midpoint */}
      {timeMidpoint && (
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
      
      {/* Direction routes */}
      {!apiKeyError && directionsA && (
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
      
      {!apiKeyError && directionsB && (
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
