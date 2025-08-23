"use client";
import React from "react";
import { useJsApiLoader, Libraries } from "@react-google-maps/api";
import { MapProvider } from "../contexts/MapContext";
import { MapView } from "../components/MapView";
import { SearchPanel } from "../components/SearchPanel";

// Define libraries array outside the component to prevent recreation on each render
const libraries: Libraries = ["places"];

export default function Home() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (!isLoaded) return <div>Loading Maps API...</div>;

  return (
    <MapProvider>
      <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
        <SearchPanel />
        <MapView isLoaded={isLoaded} />
      </div>
    </MapProvider>
  );
}