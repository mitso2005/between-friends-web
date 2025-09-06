"use client";

// Track loading state
let isLoading = false;
let loadPromise: Promise<void> | null = null;

// Function to dynamically load the Google Maps API
export function loadGoogleMapsApi(apiKey: string): Promise<void> {
  // If the API is already loaded, resolve immediately
  if (window.google && window.google.maps) {
    console.log('Google Maps API already loaded');
    return Promise.resolve();
  }
  
  // If we're already loading, return the existing promise
  if (isLoading && loadPromise) {
    console.log('Google Maps API load already in progress');
    return loadPromise;
  }
  
  // Start loading the API
  console.log('Loading Google Maps API...');
  isLoading = true;
  
  // Create the promise to load the API
  loadPromise = new Promise<void>((resolve, reject) => {
    // Check for existing script to avoid duplicates
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      console.log('Google Maps script tag already exists');
      
      // If script exists but API not loaded, wait for it
      const checkForMaps = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          setTimeout(checkForMaps, 100);
        }
      };
      
      checkForMaps();
      return;
    }
    
    // Create the script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    // Setup callbacks
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      isLoading = false;
      resolve();
    };
    
    script.onerror = (e) => {
      console.error('Failed to load Google Maps API', e);
      isLoading = false;
      loadPromise = null;
      reject(new Error('Failed to load Google Maps API'));
    };
    
    // Add script to document
    document.head.appendChild(script);
  });
  
  return loadPromise;
}
