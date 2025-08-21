"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Autocomplete,
  Marker,
  Libraries,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const defaultCenter = {
  lat: -37.8136,
  lng: 144.9631,
};

// Define libraries array outside the component to prevent recreation on each render
// This fixes the "Performance warning! LoadScript has been reloaded unintentionally!"
const libraries: Libraries = ["places"];

export default function Home() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries, // Use the libraries constant defined above
  });

  const [locationA, setLocationA] = useState("");
  const [locationB, setLocationB] = useState("");
  const [coordsA, setCoordsA] = useState<google.maps.LatLngLiteral | null>(null);
  const [coordsB, setCoordsB] = useState<google.maps.LatLngLiteral | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);

  const autocompleteA = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteB = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Input refs to directly access the DOM elements
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  // Update autocomplete bias when map bounds change
  const updateAutocompleteBias = (bounds: google.maps.LatLngBounds) => {
    if (autocompleteA.current) {
      autocompleteA.current.setBounds(bounds);
    }
    if (autocompleteB.current) {
      autocompleteB.current.setBounds(bounds);
    }
  };

  // Handle map bounds change
  const onBoundsChanged = () => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds(bounds);
        updateAutocompleteBias(bounds);
      }
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
  
  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Set initial bounds for autocomplete
    const bounds = mapInstance.getBounds();
    if (bounds) {
      setMapBounds(bounds);
      updateAutocompleteBias(bounds);
    }
  };

  const onAutocompleteLoadA = (ac: google.maps.places.Autocomplete) => {
    autocompleteA.current = ac;
    
    // Set initial autocomplete options - no country restriction for global use
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"], // Include businesses and addresses
    });

    // Apply current map bounds if available
    if (mapBounds) {
      ac.setBounds(mapBounds);
    }
  };

  const onAutocompleteLoadB = (ac: google.maps.places.Autocomplete) => {
    autocompleteB.current = ac;
    
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"],
    });

    if (mapBounds) {
      ac.setBounds(mapBounds);
    }
  };

  // Handle input changes without interfering with Autocomplete
  const handleInputAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationA(e.target.value);
  };

  const handleInputBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationB(e.target.value);
  };

  // Use effect to check if inputs are working properly
  useEffect(() => {
    if (inputARef.current) {
      // Ensure the input is working properly
      inputARef.current.style.color = '#000';
      inputARef.current.style.backgroundColor = '#fff';
    }
    if (inputBRef.current) {
      inputBRef.current.style.color = '#000';
      inputBRef.current.style.backgroundColor = '#fff';
    }
  }, [isLoaded]);

  // Fit map to show both markers when both locations are selected
  useEffect(() => {
    if (map && coordsA && coordsB) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(coordsA);
      bounds.extend(coordsB);
      map.fitBounds(bounds);
      
      // Add some padding
      const padding = { top: 100, right: 50, bottom: 50, left: 350 }; // Extra left padding for input panel
      map.fitBounds(bounds, padding);
    }
  }, [map, coordsA, coordsB]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Input panel */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 10,
          background: "rgba(255,255,255,0.95)",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "300px",
        }}
      >
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          💡 Suggestions are based on the current map view (works worldwide)
        </div>
        
        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px", display: "block" }}>
            First Location
          </label>
          <Autocomplete
            onLoad={onAutocompleteLoadA}
            onPlaceChanged={onPlaceChangedA}
          >
            <input
              ref={inputARef}
              type="text"
              placeholder="Enter first location"
              value={locationA}
              onChange={handleInputAChange}
              style={{
                padding: "8px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                width: "100%",
                color: "#000",
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }}
              id="location-input-a"
            />
          </Autocomplete>
        </div>
        
        <div>
          <label style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px", display: "block" }}>
            Second Location
          </label>
          <Autocomplete
            onLoad={onAutocompleteLoadB}
            onPlaceChanged={onPlaceChangedB}
          >
            <input
              ref={inputBRef}
              type="text"
              placeholder="Enter second location"
              value={locationB}
              onChange={handleInputBChange}
              style={{
                padding: "8px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                width: "100%",
                color: "#000",
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }}
              id="location-input-b"
            />
          </Autocomplete>
        </div>

        {/* Debug info showing current map bounds */}
        {mapBounds && (
          <div style={{ fontSize: "10px", color: "#888", marginTop: "8px" }}>
            Searching in: {mapBounds.getSouthWest().lat().toFixed(3)}, {mapBounds.getSouthWest().lng().toFixed(3)} to {mapBounds.getNorthEast().lat().toFixed(3)}, {mapBounds.getNorthEast().lng().toFixed(3)}
          </div>
        )}
      </div>
      
      {/* Map */}
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
      </GoogleMap>
    </div>
  );
}