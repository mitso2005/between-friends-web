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
  
  // Get background color based on fairness
  const bgColor = isTimeFair 
    ? "rgba(76, 175, 80, 0.1)" // Green for fair
    : "rgba(255, 152, 0, 0.1)"; // Orange for unfair
    
  // Get border color based on fairness
  const borderColor = isTimeFair 
    ? "rgba(76, 175, 80, 0.2)" // Green for fair
    : "rgba(255, 152, 0, 0.2)"; // Orange for unfair
  
  return (
    <div style={{ 
      marginTop: "12px", 
      padding: "10px", 
      backgroundColor: bgColor, 
      border: `1px solid ${borderColor}`,
      borderRadius: "4px"
    }}>
      <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
        Route Information
      </div>
      <div style={{ 
        fontSize: "13px", 
        marginBottom: "4px",
        fontWeight: longerRoute === 'A' ? '600' : '400'
      }}>
        <strong>From Location A:</strong> {timeAText} ({transportModeA.toLowerCase()})
      </div>
      <div style={{ 
        fontSize: "13px", 
        marginBottom: "4px",
        fontWeight: longerRoute === 'B' ? '600' : '400'
      }}>
        <strong>From Location B:</strong> {timeBText} ({transportModeB.toLowerCase()})
      </div>
      
      {/* Time difference info */}
      <div style={{ fontSize: "12px", marginTop: "4px", color: "#666" }}>
        Time difference: {timeDiffMinutes} min ({percentageDiff}%)
      </div>
      
      {/* Fairness indicator */}
      {!isTimeFair && (
        <div style={{ 
          fontSize: "13px", 
          marginTop: "8px", 
          padding: "6px", 
          backgroundColor: "rgba(255, 152, 0, 0.05)",
          border: "1px solid rgba(255, 152, 0, 0.1)",
          borderRadius: "4px"
        }}>
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
        <div style={{ 
          fontSize: "13px", 
          marginTop: "8px", 
          color: "#388E3C",
          fontWeight: "500"
        }}>
          ✓ Travel times are fair and balanced
        </div>
      )}
    </div>
  );
};
