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

  const autocompleteA = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteB = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Input refs to directly access the DOM elements
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  const onPlaceChangedA = () => {
    if (autocompleteA.current) {
      const place = autocompleteA.current.getPlace();
      if (place.geometry?.location) {
        setCoordsA({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        setLocationA(place.formatted_address || place.name || "");
      }
    }
  };

  const onPlaceChangedB = () => {
    if (autocompleteB.current) {
      const place = autocompleteB.current.getPlace();
      if (place.geometry?.location) {
        setCoordsB({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        setLocationB(place.formatted_address || place.name || "");
      }
    }
  };
  
  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
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
        <div>
          <Autocomplete
            onLoad={(ac) => {
              autocompleteA.current = ac;
            }}
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
              }}
              id="location-input-a"
            />
          </Autocomplete>
        </div>
        
        <div>
          <Autocomplete
            onLoad={(ac) => {
              autocompleteB.current = ac;
            }}
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
              }}
              id="location-input-b"
            />
          </Autocomplete>
        </div>
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
      >
        {coordsA && <Marker position={coordsA} />}
        {coordsB && <Marker position={coordsB} />}
      </GoogleMap>
    </div>
  );
}