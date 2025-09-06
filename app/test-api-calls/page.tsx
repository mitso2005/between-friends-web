"use client";

import React, { useState } from 'react';
import { cachedDirectionsService, resetApiCallStats } from '../../utils/apiCache';
import { logApiCallStats } from '../../utils/apiTestUtils';
import { GoogleMapsProvider, useGoogleMaps } from '../../utils/googleMapsContext';
import ApiMonitor from '../../components/ApiMonitor';

// Add Google Maps to window type
declare global {
  interface Window {
    google?: {
      maps: any;
    };
  }
}

/**
 * Test page for API call monitoring
 * This demonstrates how to use the API call tracking features
 */
export default function TestApiCallsPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { isLoaded, isLoading, error } = useGoogleMaps();
  
  // Update test results based on Google Maps loading state
  React.useEffect(() => {
    if (isLoading) {
      setTestResults(prev => [...prev, "🔄 Loading Google Maps API..."]);
    } else if (isLoaded) {
      setTestResults(prev => [...prev, "✅ Google Maps API loaded successfully"]);
    } else if (error) {
      setTestResults(prev => [...prev, `❌ Error: ${error}`]);
    }
  }, [isLoaded, isLoading, error]);
  
  // Function to make a test directions request
  const makeTestRequest = async () => {
    if (!isLoaded) {
      setTestResults(prev => [...prev, "❌ Error: Google Maps API not loaded yet"]);
      return;
    }
    try {
      const origin = { lat: 40.712776, lng: -74.005974 }; // NYC
      const destination = { lat: 34.052235, lng: -118.243683 }; // LA
      
      setTestResults(prev => [...prev, "Making directions request NYC to LA..."]);
      
      await cachedDirectionsService.route({
        origin,
        destination,
        travelMode: "DRIVING" as google.maps.TravelMode
      });
      
      setTestResults(prev => [...prev, "Request completed"]);
    } catch (error: any) {
      setTestResults(prev => [...prev, `Error: ${error?.message || "Unknown error"}`]);
    }
  };
  
  // Function to make same request again (should hit cache)
  const makeIdenticalRequest = async () => {
    if (!isLoaded) {
      setTestResults(prev => [...prev, "❌ Error: Google Maps API not loaded yet"]);
      return;
    }
    try {
      const origin = { lat: 40.712776, lng: -74.005974 }; // NYC
      const destination = { lat: 34.052235, lng: -118.243683 }; // LA
      
      setTestResults(prev => [...prev, "Making identical request (should hit cache)..."]);
      
      await cachedDirectionsService.route({
        origin,
        destination,
        travelMode: "DRIVING" as google.maps.TravelMode
      });
      
      setTestResults(prev => [...prev, "Request completed"]);
    } catch (error: any) {
      setTestResults(prev => [...prev, `Error: ${error?.message || "Unknown error"}`]);
    }
  };
  
  // Function to make a different request
  const makeDifferentRequest = async () => {
    if (!isLoaded) {
      setTestResults(prev => [...prev, "❌ Error: Google Maps API not loaded yet"]);
      return;
    }
    try {
      const origin = { lat: 51.5074, lng: -0.1278 }; // London
      const destination = { lat: 48.8566, lng: 2.3522 }; // Paris
      
      setTestResults(prev => [...prev, "Making new request London to Paris..."]);
      
      await cachedDirectionsService.route({
        origin,
        destination,
        travelMode: "DRIVING" as google.maps.TravelMode
      });
      
      setTestResults(prev => [...prev, "Request completed"]);
    } catch (error: any) {
      setTestResults(prev => [...prev, `Error: ${error?.message || "Unknown error"}`]);
    }
  };
  
  // Function to log stats to console
  const logStats = () => {
    const stats = logApiCallStats();
    setTestResults(prev => [...prev, "API stats logged to console"]);
    return stats;
  };
  
  // Function to reset stats
  const resetStats = () => {
    resetApiCallStats();
    setTestResults(prev => [...prev, "API stats reset"]);
  };
  
  // Function to clear test results
  const clearResults = () => {
    setTestResults([]);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Call Testing</h1>
      
      {/* Google Maps API status */}
      <div className={`mb-4 p-3 rounded ${isLoaded ? 'bg-green-100' : isLoading ? 'bg-yellow-100' : 'bg-red-100'}`}>
        <p className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isLoaded ? 'bg-green-500' : isLoading ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
          Google Maps API: {isLoaded ? 'Loaded' : isLoading ? 'Loading...' : 'Error'}
        </p>
        
        {!isLoaded && !isLoading && error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            <strong>Error:</strong> {error} <br/>
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
              <>
                Add your Google Maps API key to <code>.env.local</code> as:<br/>
                <code className="bg-gray-100 p-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here</code>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={makeTestRequest}
          className={`bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded ${!isLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isLoaded}
        >
          Make Test Request
        </button>
        
        <button
          onClick={makeIdenticalRequest}
          className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded ${!isLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isLoaded}
        >
          Make Identical Request
        </button>
        
        <button
          onClick={makeDifferentRequest}
          className={`bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded ${!isLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isLoaded}
        >
          Make Different Request
        </button>
        
        <button
          onClick={logStats}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
        >
          Log Stats
        </button>
        
        <button
          onClick={resetStats}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          Reset Stats
        </button>
        
        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
        >
          Clear Results
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No test results yet</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">{`[${index + 1}]`}</span> {result}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">How to Use</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Make Test Request" to make an initial API call</li>
          <li>Click "Make Identical Request" to test cache functionality</li>
          <li>Click "Make Different Request" to make a new API call</li>
          <li>Click "Log Stats" to see detailed API call statistics in the console</li>
          <li>Use the floating API Monitor widget to track stats in real-time</li>
        </ol>
      </div>
      
      {/* API Monitor component */}
      <ApiMonitor />
    </div>
  );
}
