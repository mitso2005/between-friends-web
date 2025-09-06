"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { loadGoogleMapsApi } from './loadGoogleMapsApi';

interface GoogleMapsContextType {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Create context with default values
const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  isLoading: true,
  error: null,
});

// Custom hook to use the Google Maps context
export const useGoogleMaps = () => useContext(GoogleMapsContext);

// Flag to track if we've started loading the API
let hasInitialized = false;

// Provider component that will wrap our app
export const GoogleMapsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, setState] = useState<GoogleMapsContextType>({
    isLoaded: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check if API is already loaded
    if (window.google && window.google.maps) {
      setState({
        isLoaded: true,
        isLoading: false,
        error: null,
      });
      return;
    }
    
    // Avoid multiple initialization attempts
    if (hasInitialized) return;
    hasInitialized = true;

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      setState({
        isLoaded: false,
        isLoading: false,
        error: 'No Google Maps API key found. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.',
      });
      return;
    }

    // Load the API
    loadGoogleMapsApi(apiKey)
      .then(() => {
        setState({
          isLoaded: true,
          isLoading: false,
          error: null,
        });
        console.log('Google Maps API loaded successfully via context');
      })
      .catch((error) => {
        setState({
          isLoaded: false,
          isLoading: false,
          error: error.message || 'Failed to load Google Maps API',
        });
        console.error('Failed to load Google Maps API:', error);
      });
  }, []);

  return (
    <GoogleMapsContext.Provider value={state}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
