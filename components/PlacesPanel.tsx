import React from 'react';
import { Place } from './PlacesList';
import { useHoverState } from '../utils/useHoverState';

interface PlacesPanelProps {
  places: Place[];
  isLoading: boolean;
  onPlaceSelect: (place: Place) => void;
  selectedPlace: Place | null;
  onPlaceHover?: (placeId: string | null) => void;
  hoveredPlaceId?: string | null;
}

export const PlacesPanel: React.FC<PlacesPanelProps> = ({
  places,
  isLoading,
  onPlaceSelect,
  selectedPlace,
  onPlaceHover = () => {},
  hoveredPlaceId = null
}) => {
  if (isLoading) {
    return (
      <div className="absolute top-6 right-6 z-10 bg-white p-4 rounded-lg shadow-md w-[300px]">
        <div className="animate-pulse text-accent font-medium">Searching for places...</div>
      </div>
    );
  }

  if (places.length === 0 && !isLoading) {
    return null; // Don't show the panel at all if no places and not loading
  }

  return (
    <div className="absolute top-6 right-6 z-10 bg-white p-4 rounded-lg shadow-md w-[320px]">
      <div className="text-base text-title font-semibold mb-3 flex items-center">
        <div className="w-2 h-2 rounded-full bg-accent mr-2"></div>
        Recommended Places ({places.length})
      </div>
      <div className="max-h-[75vh] overflow-y-auto pr-1 styled-scrollbar">
        {places.map(place => (
          <div 
            key={place.id}
            onClick={() => onPlaceSelect(place)}
            onMouseEnter={() => onPlaceHover(place.id)}
            onMouseLeave={() => onPlaceHover(null)}
            className={`p-3 bg-white mb-3 rounded-md cursor-pointer border ${
              selectedPlace?.id === place.id 
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
