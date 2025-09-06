import React from 'react';
import { Place } from './PlacesList';
import { useHoverState } from '../utils/useHoverState';
import { RouteInfo } from './RouteInfo';
import { TransportMode } from './TransportModeSelector';
import { useMapContext } from '../contexts/MapContext';

interface PlacesPanelProps {
  places: Place[];
  isLoading: boolean;
  onPlaceSelect: (place: Place) => void;
  selectedPlace: Place | null;
  onPlaceHover?: (placeId: string | null) => void;
  hoveredPlaceId?: string | null;
  directionsA?: google.maps.DirectionsResult;
  directionsB?: google.maps.DirectionsResult;
  transportModeA?: TransportMode;
  transportModeB?: TransportMode;
}

export const PlacesPanel: React.FC<PlacesPanelProps> = ({
  places,
  isLoading,
  onPlaceSelect,
  selectedPlace,
  onPlaceHover = () => {},
  hoveredPlaceId = null,
  directionsA,
  directionsB,
  transportModeA = 'DRIVING',
  transportModeB = 'DRIVING'
}) => {
  const { clearSelectedPlace } = useMapContext();
  
  // Helper function to safely compare IDs
  const isSelected = (place: Place) => selectedPlace?.id === place.id;
  if (isLoading) {
    return (
      <div className="absolute top-0 right-0 z-10 bg-white p-4 shadow-md w-[320px] h-screen">
        <div className="animate-pulse text-accent font-medium">Searching for places...</div>
      </div>
    );
  }

  if (places.length === 0 && !isLoading) {
    return null; // Don't show the panel at all if no places and not loading
  }

  // If a place is selected, show its details
  if (selectedPlace) {
    return (
      <div className="absolute top-0 right-0 z-10 bg-white p-4 shadow-md w-[320px] h-screen flex flex-col border-l border-zinc-200">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg text-title font-bold">Place Details</div>
          <button 
            onClick={clearSelectedPlace} 
            className="text-zinc-500 hover:text-accent text-sm"
          >
            Back to List
          </button>
        </div>
        
        {/* Place header information */}
        <div className="bg-accent-light rounded-lg p-4 mb-4">
          <h2 className="text-xl font-bold text-title mb-1">{selectedPlace.name}</h2>
          <p className="text-sm text-zinc-700 mb-2">{selectedPlace.vicinity}</p>
          <div className="flex items-center">
            <span className="text-accent font-bold mr-1">★</span>
            <span className="text-sm font-medium">{selectedPlace.rating}</span>
            <span className="text-xs text-zinc-600 ml-1.5">
              ({selectedPlace.userRatingsTotal} reviews)
            </span>
          </div>
        </div>
        
        {/* Place images if available */}
        {selectedPlace.photos && selectedPlace.photos.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-title mb-2">Photos</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedPlace.photos.slice(0, 5).map((photo, index) => (
                <img 
                  key={index}
                  src={photo.getUrl({maxWidth: 200, maxHeight: 200})} 
                  alt={`${selectedPlace.name} photo ${index + 1}`}
                  className="h-24 w-auto rounded-md object-cover"
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Route information */}
        {directionsA && directionsB && (
          <div className="flex-grow">
            <h3 className="text-sm font-semibold text-title mb-2">Route Information</h3>
            <RouteInfo 
              directionsA={directionsA}
              directionsB={directionsB}
              transportModeA={transportModeA}
              transportModeB={transportModeB}
            />
          </div>
        )}
      </div>
    );
  }
  
  // If no place is selected, show the list view
  return ( 
    <div className="absolute top-0 right-0 z-10 bg-white p-4 shadow-md w-[320px] h-screen flex flex-col border-l border-zinc-200">
      <div className="text-base text-title font-semibold mb-3 flex items-center">
        <div className="w-2 h-2 rounded-full bg-accent mr-2"></div>
        Recommended Places ({places.length})
      </div>
      <div className="flex-grow overflow-y-auto pr-1 pb-4 styled-scrollbar">
        {places.map(place => (
          <div 
            key={place.id}
            onClick={() => onPlaceSelect(place)}
            onMouseEnter={() => onPlaceHover(place.id)}
            onMouseLeave={() => onPlaceHover(null)}
            className={`p-3 bg-white mb-3 rounded-md cursor-pointer border ${
              isSelected(place)
                ? 'border-accent bg-accent-light scale-105 shadow-md' 
                : hoveredPlaceId === place.id
                  ? 'border-accent shadow-md translate-x-[-3px]' 
                  : 'border-zinc-100 hover:border-accent hover:shadow-md'
            } transition-all duration-200`}
          >
            <div className="font-semibold text-title">{place.name}</div>
            <div className="text-xs text-zinc-600 mt-1">{place.vicinity}</div>
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                <span className="text-accent mr-1">★</span>
                <span className="text-sm">{place.rating}</span>
              </div>
              <div className="text-xs text-zinc-600 ml-1.5">
                ({place.userRatingsTotal} reviews)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
