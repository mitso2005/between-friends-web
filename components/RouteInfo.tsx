import React from 'react';
import { TransportMode } from './TransportModeSelector';

interface RouteInfoProps {
  directionsA: google.maps.DirectionsResult;
  directionsB: google.maps.DirectionsResult;
  transportModeA: TransportMode;
  transportModeB: TransportMode;
}

export const RouteInfo: React.FC<RouteInfoProps> = ({
  directionsA,
  directionsB,
  transportModeA,
  transportModeB,
}) => {
  // Get travel times in seconds
  const timeA = directionsA.routes[0].legs[0].duration?.value || 0;
  const timeB = directionsB.routes[0].legs[0].duration?.value || 0;
  
  // Calculate time difference in seconds and minutes
  const timeDiffSeconds = Math.abs(timeA - timeB);
  const timeDiffMinutes = Math.round(timeDiffSeconds / 60);
  
  // Calculate percentage difference
  const maxTime = Math.max(timeA, timeB);
  const percentageDiff = Math.round((timeDiffSeconds / maxTime) * 100);
  
  // Check if times are close enough (within 5 minutes or 10%)
  const isTimeFair = timeDiffSeconds <= 300 || percentageDiff <= 10;
  
  // Determine which route is longer
  const longerRoute = timeA > timeB ? 'A' : timeA < timeB ? 'B' : 'Equal';
  
  // Get text representation
  const timeAText = directionsA.routes[0].legs[0].duration?.text || "Unknown";
  const timeBText = directionsB.routes[0].legs[0].duration?.text || "Unknown";
  
  // Get Tailwind classes based on fairness
  const containerClasses = isTimeFair 
    ? "bg-green-50 border border-green-200" // Green for fair
    : "bg-accent-light border border-accent"; // Orange for unfair
  
  return (
    <div className={`mt-3 p-2.5 rounded ${containerClasses}`}>
      <div className="text-sm text-title font-semibold mb-1.5">
        Route Information
      </div>
      <div className={`text-xs mb-1 ${longerRoute === 'A' ? 'font-semibold' : 'font-normal'}`}>
        <strong>From Location A:</strong> {timeAText} ({transportModeA.toLowerCase()})
      </div>
      <div className={`text-xs mb-1 ${longerRoute === 'B' ? 'font-semibold' : 'font-normal'}`}>
        <strong>From Location B:</strong> {timeBText} ({transportModeB.toLowerCase()})
      </div>
      
      {/* Time difference info */}
      <div className="text-xs mt-1 text-gray-600">
        Time difference: {timeDiffMinutes} min ({percentageDiff}%)
      </div>
      
      {/* Fairness indicator */}
      {!isTimeFair && (
        <div className="text-xs mt-2 p-1.5 bg-accent-light border border-accent rounded">
          <strong>Note:</strong> Travel times differ by {timeDiffMinutes} minutes. 
          {transportModeA !== transportModeB && (
            <span> This may be the best possible compromise given the different transport modes.</span>
          )}
          {transportModeA === transportModeB && (
            <span> Try a different meeting location for more equal travel times.</span>
          )}
        </div>
      )}
      
      {isTimeFair && (
        <div className="text-xs mt-2 text-accent font-medium">
          ✓ Travel times are fair and balanced
        </div>
      )}
    </div>
  );
};
