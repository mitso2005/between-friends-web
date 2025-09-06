/**
 * Helper functions for batched route calculations 
 */

import { cachedDirectionsService, queueDirectionsRequest } from './apiCache';

/**
 * Calculate transit stops from a directions response including virtual stops
 * for better midpoint calculation
 */
export const extractTransitStops = (
  route: google.maps.DirectionsResult
): { location: google.maps.LatLngLiteral; name: string }[] => {
  const stops: { location: google.maps.LatLngLiteral; name: string }[] = [];
  
  // Extract all transit stops from the route
  if (route.routes && route.routes.length > 0) {
    const legs = route.routes[0].legs;
    
    legs.forEach(leg => {
      leg.steps.forEach(step => {
        if (step.travel_mode === 'TRANSIT' && step.transit) {
          const transitName = step.transit.line?.short_name || 
                            step.transit.line?.name || 
                            step.transit.line?.vehicle?.name || 
                            "transit";
          
          // Add departure stop
          if (step.transit.departure_stop && step.transit.departure_stop.location) {
            const location = {
              lat: step.transit.departure_stop.location.lat(),
              lng: step.transit.departure_stop.location.lng()
            };
            
            stops.push({
              location,
              name: step.transit.departure_stop.name || 'Transit Stop'
            });
          }
          
          // Add arrival stop
          if (step.transit.arrival_stop && step.transit.arrival_stop.location) {
            const location = {
              lat: step.transit.arrival_stop.location.lat(),
              lng: step.transit.arrival_stop.location.lng()
            };
            
            stops.push({
              location,
              name: step.transit.arrival_stop.name || 'Transit Stop'
            });
            
            // For longer transit routes, also add some intermediate points
            // This helps find better midpoints, especially when the direct route has few stops
            if (step.transit.num_stops && step.transit.num_stops > 3) {
              const linePath = step.path || [];
              if (linePath.length > 10) {
                // Interpolate a few points along the route for better midpoint options
                const numVirtualStops = Math.min(4, Math.floor(linePath.length / 4));
                
                for (let i = 1; i <= numVirtualStops; i++) {
                  const pathIndex = Math.floor(i * linePath.length / (numVirtualStops + 1));
                  const virtualPoint = linePath[pathIndex];
                  
                  if (virtualPoint) {
                    stops.push({
                      location: {
                        lat: virtualPoint.lat(),
                        lng: virtualPoint.lng()
                      },
                      name: `Virtual stop on ${transitName}`
                    });
                  }
                }
              }
            }
          }
        } else if (step.travel_mode === 'WALKING' && step.path && step.path.length > 0) {
          // For longer walking segments, add an intermediate point
          if (step.duration?.value && step.duration.value > 600) { // > 10 minutes of walking
            const midPoint = step.path[Math.floor(step.path.length / 2)];
            if (midPoint) {
              stops.push({
                location: {
                  lat: midPoint.lat(),
                  lng: midPoint.lng()
                },
                name: "Walking connection"
              });
            }
          }
        }
      });
    });
  }
  
  // Remove duplicates
  const uniqueStops = stops.filter((stop, index, self) => 
    index === self.findIndex(s => 
      Math.abs(s.location.lat - stop.location.lat) < 0.0001 && 
      Math.abs(s.location.lng - stop.location.lng) < 0.0001
    )
  );
  
  return uniqueStops;
};

/**
 * Calculate multiple routes in parallel with rate limiting
 */
export const batchCalculateRoutes = async (
  origin: google.maps.LatLngLiteral,
  destinations: google.maps.LatLngLiteral[],
  travelMode: google.maps.TravelMode
): Promise<(google.maps.DirectionsResult | null)[]> => {
  // Create an array of promises for each destination
  const promises = destinations.map(destination => 
    queueDirectionsRequest({
      origin,
      destination,
      travelMode
    }).catch(() => null) // Handle errors gracefully
  );
  
  // Wait for all promises to resolve
  return Promise.all(promises);
};

/**
 * Calculate routes for multiple origins to a single destination
 */
export const batchCalculateRoutesFromOrigins = async (
  origins: google.maps.LatLngLiteral[],
  destination: google.maps.LatLngLiteral,
  travelMode: google.maps.TravelMode
): Promise<(google.maps.DirectionsResult | null)[]> => {
  // Create an array of promises for each origin
  const promises = origins.map(origin => 
    queueDirectionsRequest({
      origin,
      destination,
      travelMode
    }).catch(() => null) // Handle errors gracefully
  );
  
  // Wait for all promises to resolve
  return Promise.all(promises);
};
