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
    
    // When transport modes differ, we need a more thorough search
    // especially with driving vs public transport/walking
    const isDifferentModes = transportModeA !== transportModeB;
    const isOneModeDriving = 
      (transportModeA === 'DRIVING' && transportModeB !== 'DRIVING') || 
      (transportModeB === 'DRIVING' && transportModeA !== 'DRIVING');
    
    // Create a larger set of potential points when transport modes differ significantly
    let potentialPoints: google.maps.LatLngLiteral[] = [];
    
    if (isDifferentModes && isOneModeDriving) {
      // For very different transport modes, create a search grid
      // that's strongly biased toward the non-driving participant
      
      // Use aggressive bias weights - always use strict fairness settings
      const nonDrivingWeights = [0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4];
      
      // If A is driving, these weights represent how far from A toward B
      // If B is driving, we'll reverse the calculation
      const isDrivingA = transportModeA === 'DRIVING';
      
      for (const weight of nonDrivingWeights) {
        const w = isDrivingA ? weight : 1 - weight;
        potentialPoints.push({
          lat: coordsA.lat * (1 - w) + coordsB.lat * w,
          lng: coordsA.lng * (1 - w) + coordsB.lng * w
        });
      }
      
      // Add extreme points for cases with very different transport modes
      if (isDrivingA) {
        // If A is driving, add points very close to B (up to 98% of the way)
        potentialPoints.push({
          lat: coordsA.lat * 0.1 + coordsB.lat * 0.9,
          lng: coordsA.lng * 0.1 + coordsB.lng * 0.9
        });
        potentialPoints.push({
          lat: coordsA.lat * 0.05 + coordsB.lat * 0.95,
          lng: coordsA.lng * 0.05 + coordsB.lng * 0.95
        });
        potentialPoints.push({
          lat: coordsA.lat * 0.02 + coordsB.lat * 0.98,
          lng: coordsA.lng * 0.02 + coordsB.lng * 0.98
        });
      } else {
        // If B is driving, add points very close to A (up to 98% of the way)
        potentialPoints.push({
          lat: coordsA.lat * 0.9 + coordsB.lat * 0.1,
          lng: coordsA.lng * 0.9 + coordsB.lng * 0.1
        });
        potentialPoints.push({
          lat: coordsA.lat * 0.95 + coordsB.lat * 0.05,
          lng: coordsA.lng * 0.95 + coordsB.lng * 0.05
        });
        potentialPoints.push({
          lat: coordsA.lat * 0.98 + coordsB.lat * 0.02,
          lng: coordsA.lng * 0.98 + coordsB.lng * 0.02
        });
      }
    } else {
      // For similar modes or both driving, use simpler approach
      potentialPoints = [
        distanceMidpoint, // 50-50
        {
          lat: coordsA.lat * 0.75 + coordsB.lat * 0.25, // 75-25
          lng: coordsA.lng * 0.75 + coordsB.lng * 0.25
        },
        {
          lat: coordsA.lat * 0.25 + coordsB.lat * 0.75, // 25-75
          lng: coordsA.lng * 0.25 + coordsB.lng * 0.75
        },
        {
          lat: coordsA.lat * 0.6 + coordsB.lat * 0.4, // 60-40
          lng: coordsA.lng * 0.6 + coordsB.lng * 0.4
        },
        {
          lat: coordsA.lat * 0.4 + coordsB.lat * 0.6, // 40-60
          lng: coordsA.lng * 0.4 + coordsB.lng * 0.6
        }
      ];
    }
    
    let bestPoint = distanceMidpoint;
    let bestTimeDiff = Infinity;
    let routeA = null;
    let routeB = null;
    let bestTimeA = 0;
    let bestTimeB = 0;
    
    // Set threshold to 3 minutes (180 seconds) for strict fairness
    const acceptableTimeDifferenceSeconds = 180;
    
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
        
        // Update if this is the best point found so far
        if (timeDiff < bestTimeDiff) {
          bestTimeDiff = timeDiff;
          bestPoint = point;
          routeA = resultA;
          routeB = resultB;
          bestTimeA = timeA;
          bestTimeB = timeB;
        }
        
        // For acceptably close times, stop searching
        if (timeDiff < acceptableTimeDifferenceSeconds) {
          break;
        }
      } catch (error) {
        console.log("Error calculating route for point:", point, error);
      }
    }
    
    // Use binary search to refine the best point if the time difference is still significant
    // and we haven't found a point with time difference less than the acceptable threshold
    if (bestTimeDiff > acceptableTimeDifferenceSeconds && routeA && routeB) {
      // Get the direction we need to move - toward A or toward B
      const timeA = bestTimeA;
      const timeB = bestTimeB;
      
      // Determine which direction to move initially - if A has longer time, we move toward B
      let moveTowardA = timeA < timeB;
      
      // Apply a stronger bias when modes differ significantly
      let initialBias = 0.1; // Default step size
      if (isDifferentModes && isOneModeDriving) {
        initialBias = 0.25; // Very aggressive bias for different modes
      }
      
      // Number of refinement iterations
      const refinementIterations = 4; // Increased from 3 to 4
      
      // Start with the biased step size
      let step = initialBias;
      let currentPoint = bestPoint;
      
      for (let i = 0; i < refinementIterations; i++) {
        // Calculate new test point based on current position and needed direction
        const newWeightA = moveTowardA 
          ? 0.5 + step // Move toward A
          : 0.5 - step; // Move toward B
          
        const newPoint = {
          lat: coordsA.lat * newWeightA + coordsB.lat * (1 - newWeightA),
          lng: coordsA.lng * newWeightA + coordsB.lng * (1 - newWeightA),
        };
        
        try {
          const [resultA, resultB] = await Promise.all([
            new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route(
                {
                  origin: coordsA,
                  destination: newPoint,
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
                  destination: newPoint,
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
          
          const newTimeA = resultA.routes[0].legs[0].duration?.value || 0;
          const newTimeB = resultB.routes[0].legs[0].duration?.value || 0;
          const newTimeDiff = Math.abs(newTimeA - newTimeB);
          
          // If new point is better, update our best result
          if (newTimeDiff < bestTimeDiff) {
            bestTimeDiff = newTimeDiff;
            bestPoint = newPoint;
            routeA = resultA;
            routeB = resultB;
            
            // If time difference is now under 5 minutes, stop refining
            if (newTimeDiff < 300) break;
          }
          
          // Reduce step size for next iteration
          step = step / 2;
          
          // Update direction if needed
          if (newTimeA > newTimeB) {
            // Now A has longer time, so move toward A
            moveTowardA = true;
          } else {
            // B has longer time, so move toward B
            moveTowardA = false;
          }
        } catch (error) {
          console.log("Error in refining midpoint:", error);
          // Continue with next iteration anyway
          step = step / 2;
        }
      }
    }
    
    // Return the best point we found
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
