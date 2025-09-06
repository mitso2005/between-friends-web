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
  // Import the scenario-specific midpoint calculation functions
  const {
    calculateSameModeMidpoint,
    calculateWalkingVsDrivingMidpoint,
    calculateTransitVsDrivingMidpoint,
    calculateWalkingVsTransitMidpoint
  } = await import('./midpointScenarios');
  
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
    
    let result;
    
    // Scenario 1: Both users are travelling by car
    if (transportModeA === 'DRIVING' && transportModeB === 'DRIVING') {
      console.log("Using Scenario 1: Both users driving");
      result = await calculateSameModeMidpoint(coordsA, coordsB, 'DRIVING', directionsService);
    } 
    // Scenario 2: Both users are walking or both are using public transport
    else if ((transportModeA === 'WALKING' && transportModeB === 'WALKING') ||
             (transportModeA === 'TRANSIT' && transportModeB === 'TRANSIT')) {
      console.log("Using Scenario 2: Both users same non-driving mode");
      result = await calculateSameModeMidpoint(
        coordsA, 
        coordsB, 
        transportModeA, // Use either mode since they're the same
        directionsService
      );
    } 
    // Scenario 3: One user is walking, the other is driving
    else if ((transportModeA === 'WALKING' && transportModeB === 'DRIVING') ||
             (transportModeA === 'DRIVING' && transportModeB === 'WALKING')) {
      console.log("Using Scenario 3: One walking, one driving");
      result = await calculateWalkingVsDrivingMidpoint(
        coordsA,
        coordsB, 
        transportModeA, 
        transportModeB, 
        directionsService
      );
    } 
    // Scenario 4: One user is using public transport, the other is driving
    else if ((transportModeA === 'TRANSIT' && transportModeB === 'DRIVING') ||
             (transportModeA === 'DRIVING' && transportModeB === 'TRANSIT')) {
      console.log("Using Scenario 4: One transit, one driving");
      result = await calculateTransitVsDrivingMidpoint(
        coordsA, 
        coordsB, 
        transportModeA, 
        transportModeB, 
        directionsService
      );
    } 
    // Scenario 5: One user is walking, the other is using public transport
    else if ((transportModeA === 'WALKING' && transportModeB === 'TRANSIT') ||
             (transportModeA === 'TRANSIT' && transportModeB === 'WALKING')) {
      console.log("Using Scenario 5: One walking, one transit");
      result = await calculateWalkingVsTransitMidpoint(
        coordsA, 
        coordsB, 
        transportModeA, 
        transportModeB, 
        directionsService
      );
    } 
    // Fallback scenario - shouldn't happen with current transport modes
    else {
      console.log("Using fallback scenario");
      return {
        timeMidpoint: distanceMidpoint,
        directionsA: null,
        directionsB: null,
        error: "Unknown transport mode combination",
        apiKeyError: false
      };
    }
    
    // Return the result from the appropriate scenario
    return {
      timeMidpoint: result.midpoint,
      directionsA: result.directionsA,
      directionsB: result.directionsB,
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
    } else if (error === "ZERO_RESULTS") {
      // Handle the case where there is no transit route available
      return {
        timeMidpoint: distanceMidpoint,
        directionsA: null,
        directionsB: null,
        error: "No transit routes found between these locations. Using geographic midpoint instead.",
        apiKeyError: false
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
  // Scenario 1: Both users are driving
  if (transportModeA === 'DRIVING' && transportModeB === 'DRIVING') {
    return 2000; // 2 kilometers
  }
  
  // Scenario 2: Both users are walking or using public transport
  if ((transportModeA === 'WALKING' || transportModeA === 'TRANSIT') &&
      (transportModeB === 'WALKING' || transportModeB === 'TRANSIT')) {
    return 500; // 500 meters
  }
  
  // Scenario 3: One user is walking, the other is driving
  if ((transportModeA === 'WALKING' && transportModeB === 'DRIVING') ||
      (transportModeA === 'DRIVING' && transportModeB === 'WALKING')) {
    return 1500; // 1.5 kilometers around the walker
  }
  
  // Scenario 4: One user is using public transport, the other is driving
  if ((transportModeA === 'TRANSIT' && transportModeB === 'DRIVING') ||
      (transportModeA === 'DRIVING' && transportModeB === 'TRANSIT')) {
    return 1000; // 1 kilometer around the transit stop
  }
  
  // Scenario 5: One user is walking, the other is using public transport
  if ((transportModeA === 'WALKING' && transportModeB === 'TRANSIT') ||
      (transportModeA === 'TRANSIT' && transportModeB === 'WALKING')) {
    return 2000; // 2 kilometers around the walker
  }
  
  // Default fallback
  return 1000; // 1 kilometer
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
              place_id: result.place_id, // Include place_id for Google Maps links
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
