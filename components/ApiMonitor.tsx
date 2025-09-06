"use client";

import React, { useState, useEffect } from 'react';
import { getApiCallStats, resetApiCallStats, ApiCallStats } from '../utils/apiCache';
import { useGoogleMaps } from '../utils/googleMapsContext';

// Add Google Maps to window type
declare global {
  interface Window {
    google?: {
      maps: any;
    };
  }
}

/**
 * Component to monitor and display API call statistics
 */
const ApiMonitor: React.FC = () => {
  const { isLoaded } = useGoogleMaps();
  
  const [stats, setStats] = useState<ApiCallStats>(() => {
    try {
      return isLoaded ? getApiCallStats() : {
        totalDirectionsRequests: 0,
        cachedDirectionsHits: 0,
        actualDirectionsApiCalls: 0,
        totalPlacesRequests: 0,
        cachedPlacesHits: 0,
        actualPlacesApiCalls: 0
      };
    } catch (err) {
      return {
        totalDirectionsRequests: 0,
        cachedDirectionsHits: 0,
        actualDirectionsApiCalls: 0,
        totalPlacesRequests: 0,
        cachedPlacesHits: 0,
        actualPlacesApiCalls: 0
      };
    }
  });
  const [visible, setVisible] = useState<boolean>(false);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(false);
  
  // Update stats every second if auto-update is enabled
  useEffect(() => {
    if (!autoUpdate || !isLoaded) return;
    
    const interval = setInterval(() => {
      try {
        setStats(getApiCallStats());
      } catch (err) {
        console.error("Error getting API stats:", err);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [autoUpdate, isLoaded]);

  // Calculate cache hit rates
  const directionsHitRate = stats.totalDirectionsRequests 
    ? Math.round((stats.cachedDirectionsHits / stats.totalDirectionsRequests) * 100) 
    : 0;
    
  const placesHitRate = stats.totalPlacesRequests 
    ? Math.round((stats.cachedPlacesHits / stats.totalPlacesRequests) * 100) 
    : 0;

  const handleReset = () => {
    if (!isLoaded) return;
    
    try {
      resetApiCallStats();
      setStats(getApiCallStats());
    } catch (err) {
      console.error("Error resetting API stats:", err);
    }
  };

  const handleUpdate = () => {
    if (!isLoaded) return;
    
    try {
      setStats(getApiCallStats());
    } catch (err) {
      console.error("Error updating API stats:", err);
    }
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className={`fixed bottom-4 right-4 ${isLoaded ? 'bg-blue-600' : 'bg-gray-400'} text-white px-3 py-1 rounded-md shadow-md`}
        disabled={!isLoaded}
      >
        {isLoaded ? 'Show API Stats' : 'Loading Maps API...'}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white/95 border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">API Call Statistics</h3>
        <button 
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-3">
        <h4 className="font-semibold">Directions API</h4>
        <div className="grid grid-cols-2 gap-1 text-sm">
          <div>Total Requests:</div>
          <div>{stats.totalDirectionsRequests}</div>
          <div>Cache Hits:</div>
          <div>{stats.cachedDirectionsHits}</div>
          <div>API Calls:</div>
          <div>{stats.actualDirectionsApiCalls}</div>
          <div>Cache Hit Rate:</div>
          <div>{directionsHitRate}%</div>
        </div>
      </div>
      
      <div className="mb-3">
        <h4 className="font-semibold">Places API</h4>
        <div className="grid grid-cols-2 gap-1 text-sm">
          <div>Total Requests:</div>
          <div>{stats.totalPlacesRequests}</div>
          <div>Cache Hits:</div>
          <div>{stats.cachedPlacesHits}</div>
          <div>API Calls:</div>
          <div>{stats.actualPlacesApiCalls}</div>
          <div>Cache Hit Rate:</div>
          <div>{placesHitRate}%</div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button 
          onClick={handleReset}
          className={`${isLoaded ? 'bg-red-500' : 'bg-gray-400'} text-white px-2 py-1 text-xs rounded`}
          disabled={!isLoaded}
        >
          Reset
        </button>
        <button 
          onClick={handleUpdate}
          className={`${isLoaded ? 'bg-blue-500' : 'bg-gray-400'} text-white px-2 py-1 text-xs rounded`}
          disabled={!isLoaded}
        >
          Update
        </button>
        <label className={`text-xs flex items-center ${!isLoaded ? 'opacity-50' : ''}`}>
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={() => setAutoUpdate(!autoUpdate)}
            className="mr-1"
            disabled={!isLoaded}
          />
          Auto-update
        </label>
      </div>
      {!isLoaded && (
        <div className="mt-3 text-xs text-yellow-600">
          Waiting for Google Maps API to load...
        </div>
      )}
    </div>
  );
};

// Wrapped with provider for standalone usage
const ApiMonitorWithProvider: React.FC = () => {
  return (
    <React.Suspense fallback={null}>
      <ApiMonitor />
    </React.Suspense>
  );
};

export default ApiMonitor;
