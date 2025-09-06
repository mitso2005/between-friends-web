import React, { useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useMapContext } from '../contexts/MapContext';
import { PlacesPanel } from './PlacesPanel';
import { useHoverState } from '../utils/useHoverState';
import { AnimatedMarker } from './AnimatedMarker';

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
    transportModeA,
    transportModeB,
    apiKeyError,
    recommendedPlaces,
    selectedPlace,
    selectPlace,
    isSearchingPlaces
  } = useMapContext();
  
  // Track which place is being hovered
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  
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
    <>
      <GoogleMap
      mapContainerClassName={mapContainerClassName}
      center={coordsA || coordsB || defaultCenter}
      zoom={coordsA || coordsB ? 12 : 10}
      options={{
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        mapTypeControl: false,
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
      
      {/* Recommended place markers - always shown, even when a place is selected */}
      {recommendedPlaces.map(place => {
        // Don't show AnimatedMarker for the selected place as we'll show a different marker for it
        return selectedPlace?.id !== place.id ? (
          <AnimatedMarker
            key={place.id}
            id={place.id}
            position={place.location}
            title={place.name}
            onClick={() => selectPlace(place)}
            onMouseOver={() => setHoveredPlaceId(place.id)}
            onMouseOut={() => setHoveredPlaceId(null)}
            isHovered={hoveredPlaceId === place.id}
          />
        ) : null;
      })}
      
      {/* Selected place marker */}
      {selectedPlace && (
        <Marker 
          position={selectedPlace.location}
          title={selectedPlace.name}
          cursor="pointer"
          // Only bounce briefly when first selected
          animation={google.maps.Animation.DROP}
          icon={{
            // Use a custom path to create a map pin shape for selected places
            path: 'M 12,2 C 8.1340068,2 5,5.1340068 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.8659932 -3.134007,-7 -7,-7 z',
            anchor: new google.maps.Point(12, 22),
            fillColor: "#fb923c", // Tailwind orange-400
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 1.5,
            labelOrigin: new google.maps.Point(12, 9)
          }}
        />
      )}
      
      {/* Direction routes - only shown when a place is selected */}
      {!apiKeyError && directionsA && selectedPlace && (
        <DirectionsRenderer
          directions={directionsA}
          options={{
            polylineOptions: {
              strokeColor: "#fb923c", // Tailwind orange-400
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
      
      {/* Place the panel on the right side if we have places to show or are searching */}
      {(recommendedPlaces.length > 0 || isSearchingPlaces || selectedPlace) && (
        <PlacesPanel
          places={recommendedPlaces}
          isLoading={isSearchingPlaces}
          onPlaceSelect={selectPlace}
          selectedPlace={selectedPlace}
          onPlaceHover={setHoveredPlaceId}
          hoveredPlaceId={hoveredPlaceId}
          directionsA={directionsA || undefined}
          directionsB={directionsB || undefined}
          transportModeA={transportModeA}
          transportModeB={transportModeB}
        />
      )}
    </>
  );
};
