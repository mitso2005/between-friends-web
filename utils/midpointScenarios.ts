import { TransportMode } from "../components/TransportModeSelector";

export interface RoutePoint {
  point: google.maps.LatLngLiteral;
  timeFromStart: number; // in seconds
}

export interface MidpointResult {
  midpoint: google.maps.LatLngLiteral;
  directionsA: google.maps.DirectionsResult | null;
  directionsB: google.maps.DirectionsResult | null;
}

// Scenario 1 & 2: Both users use the same transport mode (car/car or walking/walking or transit/transit)
// Find the shortest route, divide time by two, find the point at half travel time
export const calculateSameModeMidpoint = async (
  coordsA: google.maps.LatLngLiteral,
  coordsB: google.maps.LatLngLiteral,
  transportMode: TransportMode,
  directionsService: google.maps.DirectionsService
): Promise<MidpointResult> => {
  // Get the route from A to B
  const directRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    directionsService.route(
      {
        origin: coordsA,
        destination: coordsB,
        travelMode: transportMode as google.maps.TravelMode,
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
  });
  
  // Get total travel time in seconds
  const totalTravelTime = directRoute.routes[0].legs[0].duration?.value || 0;
  
  // Calculate halfway time
  const halfwayTime = totalTravelTime / 2;
  
  // Extract the route polyline and build a map of points with their time from start
  const routePoints: RoutePoint[] = [];
  let cumulativeTime = 0;
  
  // Process each step in the route
  const steps = directRoute.routes[0].legs[0].steps;
  for (const step of steps) {
    // Get start point of this step
    const startPoint = {
      lat: step.start_location.lat(),
      lng: step.start_location.lng()
    };
    
    // Add start point with its time from route start
    routePoints.push({
      point: startPoint,
      timeFromStart: cumulativeTime
    });
    
    // Get end point of this step
    const endPoint = {
      lat: step.end_location.lat(),
      lng: step.end_location.lng()
    };
    
    // Add step duration to our cumulative time
    cumulativeTime += step.duration?.value || 0;
    
    // Add end point with its time from route start
    routePoints.push({
      point: endPoint,
      timeFromStart: cumulativeTime
    });
  }
  
  // Find the two points that surround our halfway time
  let beforePoint: RoutePoint | null = null;
  let afterPoint: RoutePoint | null = null;
  
  for (let i = 0; i < routePoints.length - 1; i++) {
    if (routePoints[i].timeFromStart <= halfwayTime && 
        routePoints[i + 1].timeFromStart >= halfwayTime) {
      beforePoint = routePoints[i];
      afterPoint = routePoints[i + 1];
      break;
    }
  }
  
  // If we didn't find surrounding points, use the first/last points as fallback
  if (!beforePoint || !afterPoint) {
    // This is unlikely but we handle it as a precaution
    const midpoint = {
      lat: (coordsA.lat + coordsB.lat) / 2,
      lng: (coordsA.lng + coordsB.lng) / 2
    };
    
    return { midpoint, directionsA: null, directionsB: null };
  }
  
  // Interpolate to find the exact halfway point
  const segmentDuration = afterPoint.timeFromStart - beforePoint.timeFromStart;
  const segmentProgress = segmentDuration === 0 ? 0 : 
    (halfwayTime - beforePoint.timeFromStart) / segmentDuration;
  
  const midpoint = {
    lat: beforePoint.point.lat + segmentProgress * (afterPoint.point.lat - beforePoint.point.lat),
    lng: beforePoint.point.lng + segmentProgress * (afterPoint.point.lng - beforePoint.point.lng)
  };
  
  // Calculate routes from both origins to this midpoint
  const [directionsA, directionsB] = await Promise.all([
    new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      directionsService.route(
        {
          origin: coordsA,
          destination: midpoint,
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
    }),
    new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      directionsService.route(
        {
          origin: coordsB,
          destination: midpoint,
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
    })
  ]);
  
  return { midpoint, directionsA, directionsB };
};

// Scenario 3: One user is walking, the other is driving
// Set midpoint to the location of the walker
export const calculateWalkingVsDrivingMidpoint = async (
  coordsA: google.maps.LatLngLiteral,
  coordsB: google.maps.LatLngLiteral,
  transportModeA: TransportMode,
  transportModeB: TransportMode,
  directionsService: google.maps.DirectionsService
): Promise<MidpointResult> => {
  // Determine which user is walking
  const isAWalking = transportModeA === 'WALKING';
  const walkerCoords = isAWalking ? coordsA : coordsB;
  const driverCoords = isAWalking ? coordsB : coordsA;
  
  // Get route from driver to walker
  const drivingRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    directionsService.route(
      {
        origin: driverCoords,
        destination: walkerCoords,
        travelMode: 'DRIVING' as google.maps.TravelMode,
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
  
  // Set directionsA and directionsB appropriately based on which user is walking
  let directionsA: google.maps.DirectionsResult | null = null;
  let directionsB: google.maps.DirectionsResult | null = null;
  
  if (isAWalking) {
    // User A is walking (staying in place), User B is driving to A
    directionsA = null; // No directions needed for A since they're already at the midpoint
    directionsB = drivingRoute;
  } else {
    // User B is walking (staying in place), User A is driving to B
    directionsA = drivingRoute;
    directionsB = null; // No directions needed for B since they're already at the midpoint
  }
  
  return { midpoint: walkerCoords, directionsA, directionsB };
};

// Scenario 4: One user is using public transport, the other is driving
// Find the transit stop where transit and driving times are closest
export const calculateTransitVsDrivingMidpoint = async (
  coordsA: google.maps.LatLngLiteral,
  coordsB: google.maps.LatLngLiteral,
  transportModeA: TransportMode,
  transportModeB: TransportMode,
  directionsService: google.maps.DirectionsService
): Promise<MidpointResult> => {
  // Determine which user is using transit
  const isATransit = transportModeA === 'TRANSIT';
  const transitUserCoords = isATransit ? coordsA : coordsB;
  const driverCoords = isATransit ? coordsB : coordsA;
  
  // Get transit route from transit user to driver
  const transitRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    directionsService.route(
      {
        origin: transitUserCoords,
        destination: driverCoords,
        travelMode: 'TRANSIT' as google.maps.TravelMode,
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
  
  // Extract transit stops with their travel times
  interface TransitStop {
    location: google.maps.LatLngLiteral;
    timeFromTransitUser: number; // in seconds
  }
  
  const transitStops: TransitStop[] = [];
  let cumulativeTime = 0;
  
  // Process each step in the transit route
  const transitSteps = transitRoute.routes[0].legs[0].steps;
  for (const step of transitSteps) {
    // We're only interested in steps that involve transit (bus, train, etc.)
    if (step.travel_mode === "TRANSIT") {
      // Get all stops in this transit step
      const transitDetails = step.transit?.line?.vehicle?.name || "transit";
      
      // Add departure stop
      if (step.transit?.departure_stop?.location) {
        transitStops.push({
          location: {
            lat: step.transit.departure_stop.location.lat(),
            lng: step.transit.departure_stop.location.lng()
          },
          timeFromTransitUser: cumulativeTime
        });
      }
      
      // Update cumulative time after this transit segment
      cumulativeTime += step.duration?.value || 0;
      
      // Add arrival stop
      if (step.transit?.arrival_stop?.location) {
        transitStops.push({
          location: {
            lat: step.transit.arrival_stop.location.lat(),
            lng: step.transit.arrival_stop.location.lng()
          },
          timeFromTransitUser: cumulativeTime
        });
      }
    } else {
      // For non-transit steps (walking connections), just update time
      cumulativeTime += step.duration?.value || 0;
    }
  }
  
  // If we didn't find any transit stops, use distance midpoint
  if (transitStops.length === 0) {
    const midpoint = {
      lat: (coordsA.lat + coordsB.lat) / 2,
      lng: (coordsA.lng + coordsB.lng) / 2
    };
    
    return { midpoint, directionsA: null, directionsB: null };
  }
  
  // Calculate driving times from driver to each transit stop
  const drivingTimes: number[] = [];
  const drivingDirections: google.maps.DirectionsResult[] = [];
  
  for (const stop of transitStops) {
    try {
      const drivingRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: driverCoords,
            destination: stop.location,
            travelMode: 'DRIVING' as google.maps.TravelMode,
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
      
      const drivingTime = drivingRoute.routes[0].legs[0].duration?.value || 0;
      drivingTimes.push(drivingTime);
      drivingDirections.push(drivingRoute);
    } catch (error) {
      // If we can't calculate driving time for this stop, use a very high value
      drivingTimes.push(999999);
      drivingDirections.push(null as any); // Placeholder
    }
  }
  
  // Find the stop where transit and driving times are closest
  let bestStopIndex = 0;
  let smallestTimeDiff = Infinity;
  
  for (let i = 0; i < transitStops.length; i++) {
    const timeDiff = Math.abs(transitStops[i].timeFromTransitUser - drivingTimes[i]);
    if (timeDiff < smallestTimeDiff) {
      smallestTimeDiff = timeDiff;
      bestStopIndex = i;
    }
  }
  
  // Get the best stop
  const bestStop = transitStops[bestStopIndex];
  
  // Calculate transit directions to the best stop
  const transitToStopRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    directionsService.route(
      {
        origin: transitUserCoords,
        destination: bestStop.location,
        travelMode: 'TRANSIT' as google.maps.TravelMode,
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
  
  // Set directionsA and directionsB appropriately
  let directionsA: google.maps.DirectionsResult | null;
  let directionsB: google.maps.DirectionsResult | null;
  
  if (isATransit) {
    // User A is using transit, User B is driving
    directionsA = transitToStopRoute;
    directionsB = drivingDirections[bestStopIndex];
  } else {
    // User A is driving, User B is using transit
    directionsA = drivingDirections[bestStopIndex];
    directionsB = transitToStopRoute;
  }
  
  return { midpoint: bestStop.location, directionsA, directionsB };
};

// Scenario 5: One user is walking, the other is using public transport
// Set midpoint to the location of the walker
export const calculateWalkingVsTransitMidpoint = async (
  coordsA: google.maps.LatLngLiteral,
  coordsB: google.maps.LatLngLiteral,
  transportModeA: TransportMode,
  transportModeB: TransportMode,
  directionsService: google.maps.DirectionsService
): Promise<MidpointResult> => {
  // Determine which user is walking
  const isAWalking = transportModeA === 'WALKING';
  const walkerCoords = isAWalking ? coordsA : coordsB;
  const transitUserCoords = isAWalking ? coordsB : coordsA;
  
  // Get transit route from transit user to walker
  const transitRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    directionsService.route(
      {
        origin: transitUserCoords,
        destination: walkerCoords,
        travelMode: 'TRANSIT' as google.maps.TravelMode,
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
  
  // Set directionsA and directionsB appropriately based on which user is walking
  let directionsA: google.maps.DirectionsResult | null = null;
  let directionsB: google.maps.DirectionsResult | null = null;
  
  if (isAWalking) {
    // User A is walking (staying in place), User B is taking transit to A
    directionsA = null; // No directions needed for A since they're already at the midpoint
    directionsB = transitRoute;
  } else {
    // User B is walking (staying in place), User A is taking transit to B
    directionsA = transitRoute;
    directionsB = null; // No directions needed for B since they're already at the midpoint
  }
  
  return { midpoint: walkerCoords, directionsA, directionsB };
};
