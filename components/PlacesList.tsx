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
      <div style={{ 
        marginTop: "12px", 
        padding: "12px", 
        backgroundColor: "rgba(255, 255, 255, 0.8)", 
        borderRadius: "4px",
        textAlign: "center" 
      }}>
        <div className="animate-pulse">Searching for places...</div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div style={{ 
        marginTop: "12px", 
        padding: "12px", 
        backgroundColor: "rgba(255, 255, 255, 0.8)", 
        borderRadius: "4px",
        textAlign: "center" 
      }}>
        No places found in this area. Try changing the place type or locations.
      </div>
    );
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
        Recommended Places ({places.length})
      </div>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {places.map(place => (
          <div 
            key={place.id}
            onClick={() => onPlaceSelect(place)}
            style={{
              padding: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              marginBottom: "8px",
              borderRadius: "4px",
              cursor: "pointer",
              border: "1px solid #eee",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontWeight: "600", fontSize: "14px" }}>{place.name}</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>{place.vicinity}</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "#FFC107", marginRight: "4px" }}>★</span>
                <span style={{ fontSize: "12px" }}>{place.rating}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginLeft: "6px" }}>
                ({place.userRatingsTotal} reviews)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
