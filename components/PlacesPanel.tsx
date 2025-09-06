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
    const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
    const totalPhotos = selectedPlace.photos?.length || 0;
    
    // Functions to navigate through photos
    const nextPhoto = () => {
      if (totalPhotos > 0) {
        setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % totalPhotos);
      }
    };
    
    const prevPhoto = () => {
      if (totalPhotos > 0) {
        setCurrentPhotoIndex((prevIndex) => 
          prevIndex === 0 ? totalPhotos - 1 : prevIndex - 1
        );
      }
    };
    
    // Prepare Google Maps URL
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}&query_place_id=${selectedPlace.place_id}`;
    
    return (
      <div className="absolute top-0 right-0 z-10 bg-white p-4 shadow-md w-[400px] h-screen flex flex-col border-l border-zinc-200">
        {/* Header with back arrow and title */}
        <div className="flex justify-between items-center mb-6 pt-2">
          <button 
            onClick={clearSelectedPlace} 
            className="text-zinc-700 hover:text-accent p-1 rounded-full hover:bg-accent-light"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="text-lg text-title font-semibold">Place Details</div>
        </div>
        
        {/* Place header information */}
        <h2 className="text-2xl font-bold text-title mb-3">{selectedPlace.name}</h2>
        
        {/* Ratings */}
        <div className="flex items-center mb-3">
          <span className="text-accent font-bold mr-1">★</span>
          <span className="text-sm font-medium">{selectedPlace.rating}</span>
          <span className="text-xs text-zinc-600 ml-1.5">
            ({selectedPlace.userRatingsTotal} reviews)
          </span>
        </div>
        
        {/* Address */}
        <p className="text-sm text-zinc-700 mb-4">{selectedPlace.vicinity}</p>
        
        {/* Google Maps button */}
        <a 
          href={googleMapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mb-6 bg-accent hover:bg-orange-500 text-white font-medium py-2.5 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Take me there with Google Maps
        </a>
        
        {/* Photo carousel or placeholder */}
        <div className="mb-6 relative">
          {selectedPlace.photos && selectedPlace.photos.length > 0 ? (
            <div className="aspect-[4/3] relative overflow-hidden rounded-lg">
              <img 
                src={selectedPlace.photos[currentPhotoIndex].getUrl({maxWidth: 800, maxHeight: 600})}
                alt={`${selectedPlace.name}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation arrows */}
              {totalPhotos > 1 && (
                <>
                  <button 
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button 
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  
                  {/* Photo counter */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                    {currentPhotoIndex + 1} / {totalPhotos}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-zinc-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-zinc-400 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-zinc-500 text-sm">No photos available</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Route information */}
        {directionsA && directionsB && (
          <div className="flex-grow">
            <h3 className="text-base font-semibold text-title mb-2 border-t border-zinc-200 pt-4">Route Information</h3>
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
    <div className="absolute top-0 right-0 z-10 bg-white p-4 shadow-md w-[400px] h-screen flex flex-col border-l border-zinc-200">
      <div className="text-lg text-title font-semibold mb-4 pt-2 flex items-center">
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
            className={`p-4 bg-white mb-3 rounded-md cursor-pointer border ${
              isSelected(place)
                ? 'border-accent bg-accent-light scale-105 shadow-md' 
                : hoveredPlaceId === place.id
                  ? 'border-accent shadow-md translate-x-[-3px]' 
                  : 'border-zinc-100 hover:border-accent hover:shadow-md'
            } transition-all duration-200`}
          >
            <div className="font-semibold text-title text-lg">{place.name}</div>
            <div className="text-sm text-zinc-600 mt-1">{place.vicinity}</div>
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                <span className="text-accent mr-1">★</span>
                <span className="text-sm">{place.rating}</span>
              </div>
              <div className="text-xs text-zinc-600 ml-1.5">
                ({place.userRatingsTotal} reviews)
              </div>
            </div>
            
            {/* Preview image if available */}
            {place.photos && place.photos.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-md">
                <img 
                  src={place.photos[0].getUrl({maxWidth: 400, maxHeight: 200})}
                  alt={place.name}
                  className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
