import React from 'react';
import { PlaceType } from './PlaceTypeSelector';

export interface Place {
  id: string;
  name: string;
  vicinity: string;
  rating: number;
  userRatingsTotal: number;
  location: google.maps.LatLngLiteral;
  photos?: google.maps.places.PlacePhoto[];
  types: string[];
}

interface PlacesListProps {
  places: Place[];
  isLoading: boolean;
  onPlaceSelect: (place: Place) => void;
}

export const PlacesList: React.FC<PlacesListProps> = ({
  places,
  isLoading,
  onPlaceSelect,
}) => {
  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-white rounded text-center border border-gray-300">
        <div className="animate-pulse text-accent">Searching for places...</div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="mt-3 p-3 bg-white rounded text-center border border-gray-300">
        No places found in this area. Try changing the place type or locations.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="text-sm text-title font-medium mb-2">
        Recommended Places ({places.length})
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {places.map(place => (
          <div 
            key={place.id}
            onClick={() => onPlaceSelect(place)}
            className="p-2.5 bg-white mb-2 rounded cursor-pointer border border-gray-100 transition-all duration-200 hover:border-accent hover:shadow"
          >
            <div className="font-semibold text-sm text-title">{place.name}</div>
            <div className="text-xs text-gray-600 mt-0.5">{place.vicinity}</div>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                <span className="text-accent mr-1">★</span>
                <span className="text-xs">{place.rating}</span>
              </div>
              <div className="text-xs text-gray-600 ml-1.5">
                ({place.userRatingsTotal} reviews)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
