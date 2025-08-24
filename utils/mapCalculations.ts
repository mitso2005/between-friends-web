import { TransportMode } from "../components/TransportModeSelector";
import { Place } from "../components/PlacesList";
import { PlaceType } from "../components/PlaceTypeSelector";

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

// Determine search radius based on transport modes
export const getSearchRadius = (
  transportModeA: TransportMode,
  transportModeB: TransportMode
): number => {
  // If either person is walking or using public transport, use smaller radius
  if (transportModeA === 'WALKING' || transportModeA === 'TRANSIT' ||
      transportModeB === 'WALKING' || transportModeB === 'TRANSIT') {
    return 500; // 500 meters
  } else {
    return 2000; // 2 kilometers
  }
};

// Search for places near the midpoint
export const findNearbyPlaces = async (
  midpoint: google.maps.LatLngLiteral,
  placeType: PlaceType,
  radius: number
): Promise<Place[]> => {
  return new Promise((resolve, reject) => {
    try {
      const placesService = new google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      placesService.nearbySearch(
        {
          location: midpoint,
          radius: radius,
          type: placeType, // Google Maps API uses the same types we defined
          rankBy: google.maps.places.RankBy.PROMINENCE
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Convert the results to our Place type
            const places: Place[] = results.map(result => ({
              id: result.place_id || `place-${Math.random()}`,
              name: result.name || 'Unnamed Place',
              vicinity: result.vicinity || '',
              rating: result.rating || 0,
              userRatingsTotal: result.user_ratings_total || 0,
              location: {
                lat: result.geometry?.location?.lat() || midpoint.lat,
                lng: result.geometry?.location?.lng() || midpoint.lng
              },
              photos: result.photos,
              types: result.types || [],
            }));
            
            // Sort places by rating (highest first)
            const sortedPlaces = places.sort((a, b) => b.rating - a.rating);
            
            resolve(sortedPlaces);
          } else {
            resolve([]); // Return empty array if no results or error
          }
        }
      );
    } catch (error) {
      console.error("Error finding nearby places:", error);
      resolve([]); // Return empty array on error
    }
  });
};

// Get route to a specific place
export const getRouteToPlace = async (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  transportMode: TransportMode
): Promise<google.maps.DirectionsResult | null> => {
  try {
    const directionsService = new google.maps.DirectionsService();
    
    return new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: transportMode as google.maps.TravelMode,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(status);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error getting route to place:", error);
    return null;
  }
};
