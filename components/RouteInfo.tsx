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
  return (
    <div style={{ 
      marginTop: "12px", 
      padding: "10px", 
      backgroundColor: "rgba(76, 175, 80, 0.1)", 
      border: "1px solid rgba(76, 175, 80, 0.2)",
      borderRadius: "4px"
    }}>
      <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
        Route Information
      </div>
      <div style={{ fontSize: "13px", marginBottom: "4px" }}>
        <strong>From Location A:</strong> {directionsA.routes[0].legs[0].duration?.text || "Unknown"} ({transportModeA.toLowerCase()})
      </div>
      <div style={{ fontSize: "13px" }}>
        <strong>From Location B:</strong> {directionsB.routes[0].legs[0].duration?.text || "Unknown"} ({transportModeB.toLowerCase()})
      </div>
    </div>
  );
};
