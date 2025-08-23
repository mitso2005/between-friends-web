import { TransportMode } from "../components/TransportModeSelector";

export interface CalculationResult {
  timeMidpoint: google.maps.LatLngLiteral;
  directionsA: google.maps.DirectionsResult | null;
  directionsB: google.maps.DirectionsResult | null;
  error: string | null;
  apiKeyError: boolean;
}

export const calculateDistanceMidpoint = (
  coordsA: google.maps.LatLngLiteral, 
  coordsB: google.maps.LatLngLiteral
): google.maps.LatLngLiteral => {
  return {
    lat: (coordsA.lat + coordsB.lat) / 2,
    lng: (coordsA.lng + coordsB.lng) / 2
  };
};

export const calculateTimeMidpoint = async (
  coordsA: google.maps.LatLngLiteral,
  coordsB: google.maps.LatLngLiteral,
  transportModeA: TransportMode,
  transportModeB: TransportMode
): Promise<CalculationResult> => {
  // Default result with fallback to distance midpoint
  const distanceMidpoint = calculateDistanceMidpoint(coordsA, coordsB);
  const defaultResult: CalculationResult = {
    timeMidpoint: distanceMidpoint,
    directionsA: null,
    directionsB: null,
    error: null,
    apiKeyError: false,
  };
  
  try {
    // Create directions service
    const directionsService = new google.maps.DirectionsService();
    
    // Test if directions service works with our API key
    try {
      await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: coordsA,
            destination: distanceMidpoint,
            travelMode: "DRIVING" as google.maps.TravelMode,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              if (status === "REQUEST_DENIED") {
                reject(new Error("API key not authorized for Directions API"));
              } else {
                reject(status);
              }
            }
          }
        );
      });
    } catch (error: any) {
      if (error.message === "API key not authorized for Directions API" || 
          (typeof error === 'string' && error === "REQUEST_DENIED")) {
        return {
          ...defaultResult,
          apiKeyError: true,
          error: "Your Google Maps API key is not authorized for the Directions Service. Using geographic midpoint instead."
        };
      }
    }
    
    // Define potential points to check
    const potentialPoints: google.maps.LatLngLiteral[] = [
      distanceMidpoint,
      {
        lat: coordsA.lat * 0.75 + coordsB.lat * 0.25,
        lng: coordsA.lng * 0.75 + coordsB.lng * 0.25
      },
      {
        lat: coordsA.lat * 0.25 + coordsB.lat * 0.75,
        lng: coordsA.lng * 0.25 + coordsB.lng * 0.75
      }
    ];
    
    let bestPoint = distanceMidpoint;
    let bestTimeDiff = Infinity;
    let routeA = null;
    let routeB = null;
    
    // Check each potential point
    for (const point of potentialPoints) {
      try {
        const [resultA, resultB] = await Promise.all([
          new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route(
              {
                origin: coordsA,
                destination: point,
                travelMode: transportModeA as google.maps.TravelMode,
                provideRouteAlternatives: false,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              }
            );
          }),
          new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route(
              {
                origin: coordsB,
                destination: point,
                travelMode: transportModeB as google.maps.TravelMode,
                provideRouteAlternatives: false,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              }
            );
          })
        ]);
        
        const timeA = resultA.routes[0].legs[0].duration?.value || 0;
        const timeB = resultB.routes[0].legs[0].duration?.value || 0;
        const timeDiff = Math.abs(timeA - timeB);
        
        if (timeDiff < bestTimeDiff) {
          bestTimeDiff = timeDiff;
          bestPoint = point;
          routeA = resultA;
          routeB = resultB;
        }
        
        const maxTime = Math.max(timeA, timeB);
        if (timeDiff / maxTime < 0.1) { // 10% margin of error
          break;
        }
      } catch (error) {
        console.log("Error calculating route for point:", point, error);
      }
    }
    
    // Additional refinement if needed
    if (bestTimeDiff > 0 && routeA && routeB) {
      const timeA = routeA.routes[0].legs[0].duration?.value || 0;
      const timeB = routeB.routes[0].legs[0].duration?.value || 0;
      
      if (Math.abs(timeA - timeB) / Math.max(timeA, timeB) > 0.2) {
        const ratio = timeA > timeB ? 0.4 : 0.6;
        const midBetweenBestPoints = {
          lat: coordsA.lat * ratio + coordsB.lat * (1 - ratio),
          lng: coordsA.lng * ratio + coordsB.lng * (1 - ratio)
        };
        
        try {
          const [refinedResultA, refinedResultB] = await Promise.all([
            new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route(
                {
                  origin: coordsA,
                  destination: midBetweenBestPoints,
                  travelMode: transportModeA as google.maps.TravelMode,
                },
                (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                }
              );
            }),
            new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route(
                {
                  origin: coordsB,
                  destination: midBetweenBestPoints,
                  travelMode: transportModeB as google.maps.TravelMode,
                },
                (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                }
              );
            })
          ]);
          
          const refinedTimeA = refinedResultA.routes[0].legs[0].duration?.value || 0;
          const refinedTimeB = refinedResultB.routes[0].legs[0].duration?.value || 0;
          const refinedTimeDiff = Math.abs(refinedTimeA - refinedTimeB);
          
          if (refinedTimeDiff < bestTimeDiff) {
            bestPoint = midBetweenBestPoints;
            bestTimeDiff = refinedTimeDiff;
            routeA = refinedResultA;
            routeB = refinedResultB;
          }
        } catch (error) {
          console.log("Error in refining midpoint", error);
        }
      }
    }
    
    return {
      timeMidpoint: bestPoint,
      directionsA: routeA,
      directionsB: routeB,
      error: null,
      apiKeyError: false
    };
    
  } catch (error) {
    console.error("Error calculating time midpoint:", error);
    
    if (error === "REQUEST_DENIED" || (error as any)?.message?.includes("API key")) {
      return {
        timeMidpoint: distanceMidpoint,
        directionsA: null,
        directionsB: null,
        error: "Your Google Maps API key is not authorized for the Directions Service. Using geographic midpoint instead.",
        apiKeyError: true
      };
    } else {
      return {
        timeMidpoint: distanceMidpoint,
        directionsA: null,
        directionsB: null,
        error: "Error calculating meeting point. Please try again.",
        apiKeyError: false
      };
    }
  }
};
