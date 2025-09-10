/**
 * Optimized midpoint scenario functions that use caching and batching to minimize API calls
 */

import { TransportMode } from "../components/TransportModeSelector";
import { 
  cachedDirectionsService, 
  queueDirectionsRequest 
} from "./apiCache";
import { 
  extractTransitStops, 
  batchCalculateRoutes,
  batchCalculateRoutesFromOrigins
} from "./batchRoutes";

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
  // Default to geographic midpoint in case of errors
  const fallbackMidpoint = {
    lat: (coordsA.lat + coordsB.lat) / 2,
    lng: (coordsA.lng + coordsB.lng) / 2
  };
  
  try {
    // Get the route from A to B using cached service
    const directRoute = await cachedDirectionsService.route(
      {
        origin: coordsA,
        destination: coordsB,
        travelMode: transportMode as google.maps.TravelMode,
        provideRouteAlternatives: false,
      }
    );

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
      routePoints.push({
        point: startPoint,
        timeFromStart: cumulativeTime
      });
      // Get end point of this step
      const endPoint = {
        lat: step.end_location.lat(),
        lng: step.end_location.lng()
      };
      cumulativeTime += step.duration?.value || 0;
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
      return { midpoint: fallbackMidpoint, directionsA: null, directionsB: null };
    }

    // Interpolate to find the exact halfway point
    const segmentDuration = afterPoint.timeFromStart - beforePoint.timeFromStart;
    const segmentProgress = segmentDuration === 0 ? 0 : 
      (halfwayTime - beforePoint.timeFromStart) / segmentDuration;
    let midpoint = {
      lat: beforePoint.point.lat + segmentProgress * (afterPoint.point.lat - beforePoint.point.lat),
      lng: beforePoint.point.lng + segmentProgress * (afterPoint.point.lng - beforePoint.point.lng)
    };

    // If transit mode, snap midpoint to closest shared transit stop
    if (transportMode === 'TRANSIT') {
      // Extract all transit stops from the route
      const stops = extractTransitStops(directRoute);
      // Find the closest stop to the calculated midpoint
      let closestStop = stops[0];
      let minDist = Infinity;
      for (const stop of stops) {
        const dLat = stop.location.lat - midpoint.lat;
        const dLng = stop.location.lng - midpoint.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111139; // meters
        if (dist < minDist) {
          minDist = dist;
          closestStop = stop;
        }
      }
      // Snap midpoint to closest stop if within 1km, otherwise keep original midpoint
      if (closestStop && minDist < 1000) {
        midpoint = closestStop.location;
      }
    }

    try {
      // Calculate routes from both origins to this midpoint in parallel
      const [directionsA, directionsB] = await Promise.all([
        cachedDirectionsService.route({
          origin: coordsA,
          destination: midpoint,
          travelMode: transportMode as google.maps.TravelMode,
        }),
        cachedDirectionsService.route({
          origin: coordsB,
          destination: midpoint,
          travelMode: transportMode as google.maps.TravelMode,
        })
      ]);
      return { midpoint, directionsA, directionsB };
    } catch (error) {
      console.log("Error calculating routes to midpoint:", error);
      // If we can't get routes to the midpoint, still return the midpoint
      return { midpoint, directionsA: null, directionsB: null };
    }
  } catch (error) {
    console.log("Error in calculateSameModeMidpoint:", error);
    return { midpoint: fallbackMidpoint, directionsA: null, directionsB: null };
  }
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
  
  // Get route from driver to walker using cached service
  const drivingRoute = await cachedDirectionsService.route(
    {
      origin: driverCoords,
      destination: walkerCoords,
      travelMode: 'DRIVING' as google.maps.TravelMode,
    }
  );
  
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
  // Default fallback midpoint (geographic midpoint)
  const fallbackMidpoint = {
    lat: (coordsA.lat + coordsB.lat) / 2,
    lng: (coordsA.lng + coordsB.lng) / 2
  };
  
  // Determine which user is using transit
  const isATransit = transportModeA === 'TRANSIT';
  const transitUserCoords = isATransit ? coordsA : coordsB;
  const driverCoords = isATransit ? coordsB : coordsA;
  
  try {
    // Get transit route from transit user to driver
    let transitRoute;
    try {
      transitRoute = await cachedDirectionsService.route(
        {
          origin: transitUserCoords,
          destination: driverCoords,
          travelMode: 'TRANSIT' as google.maps.TravelMode,
        }
      );
    } catch (error) {
      console.log("No transit route available, falling back to midpoint at transit user location", error);
      
      // If there's no transit route, use the transit user's location as the midpoint
      // This is similar to the walking scenario - we meet where the transit user is
      let directionsA: google.maps.DirectionsResult | null = null;
      let directionsB: google.maps.DirectionsResult | null = null;
      
      try {
        // Get directions for the driver to the transit user
        const drivingRoute = await cachedDirectionsService.route(
          {
            origin: driverCoords,
            destination: transitUserCoords,
            travelMode: 'DRIVING' as google.maps.TravelMode,
          }
        );
        
        // Assign the directions appropriately
        if (isATransit) {
          directionsA = null; // Transit user A is already there
          directionsB = drivingRoute; // Driver B gets directions
        } else {
          directionsA = drivingRoute; // Driver A gets directions
          directionsB = null; // Transit user B is already there
        }
      } catch (drivingError) {
        console.log("Error getting driving directions:", drivingError);
      }
      
      return { 
        midpoint: transitUserCoords, 
        directionsA, 
        directionsB 
      };
    }
    
    // Extract transit stops with their travel times
    interface TransitStop {
      location: google.maps.LatLngLiteral;
      timeFromTransitUser: number; // in seconds
      name?: string;
    }
    
    // Extract transit stops with their travel times
    const transitStops: TransitStop[] = [];
    let cumulativeTime = 0;
    
    console.log(`Analyzing transit route from ${isATransit ? 'A to B' : 'B to A'}`);
    
    // Process each step in the transit route
    const transitSteps = transitRoute.routes[0].legs[0].steps;
    for (const step of transitSteps) {
      // We're only interested in steps that involve transit (bus, train, etc.)
      if (step.travel_mode === "TRANSIT") {
        const transitName = step.transit?.line?.short_name || 
                          step.transit?.line?.name || 
                          step.transit?.line?.vehicle?.name || 
                          "transit";
        
        // Add departure stop
        if (step.transit?.departure_stop?.location) {
          const stopName = step.transit.departure_stop.name || "Unknown Stop";
          console.log(`Found transit departure stop: ${stopName}, time from origin: ${Math.round(cumulativeTime/60)}min`);
          
          transitStops.push({
            location: {
              lat: step.transit.departure_stop.location.lat(),
              lng: step.transit.departure_stop.location.lng()
            },
            timeFromTransitUser: cumulativeTime,
            name: stopName
          });
        }
        
        // Update cumulative time after this transit segment
        cumulativeTime += step.duration?.value || 0;
        
        // Add arrival stop
        if (step.transit?.arrival_stop?.location) {
          const stopName = step.transit.arrival_stop.name || "Unknown Stop";
          console.log(`Found transit arrival stop: ${stopName}, time from origin: ${Math.round(cumulativeTime/60)}min`);
          
          transitStops.push({
            location: {
              lat: step.transit.arrival_stop.location.lat(),
              lng: step.transit.arrival_stop.location.lng()
            },
            timeFromTransitUser: cumulativeTime,
            name: stopName
          });
          
          // For longer transit routes, also add some intermediate points
          // This helps find better midpoints, especially when the direct route has few stops
          if (step.transit.num_stops && step.transit.num_stops > 3) {
            const stepDuration = step.duration?.value || 0;
            const timePerStop = stepDuration / (step.transit.num_stops || 1);
            
            // Add virtual stops at regular intervals between departure and arrival
            // We add these "interpolated stops" to increase the chances of finding a balanced midpoint
            const linePath = step.path || [];
            if (linePath.length > 10) {
              // Interpolate a few points along the route for better midpoint options
              const numVirtualStops = Math.min(4, Math.floor(linePath.length / 4));
              
              for (let i = 1; i <= numVirtualStops; i++) {
                const pathIndex = Math.floor(i * linePath.length / (numVirtualStops + 1));
                const virtualPoint = linePath[pathIndex];
                const virtualStopTime = cumulativeTime - stepDuration + (i * timePerStop * (step.transit.num_stops / (numVirtualStops + 1)));
                
                console.log(`Adding virtual stop along ${transitName}, time from origin: ${Math.round(virtualStopTime/60)}min`);
                
                transitStops.push({
                  location: {
                    lat: virtualPoint.lat(),
                    lng: virtualPoint.lng()
                  },
                  timeFromTransitUser: virtualStopTime,
                  name: `Virtual stop on ${transitName}`
                });
              }
            }
          }
        }
      } else {
        // For non-transit steps (walking connections), just update time
        cumulativeTime += step.duration?.value || 0;
        
        // For longer walking segments, add an intermediate point
        if (step.duration?.value && step.duration.value > 600) { // > 10 minutes of walking
          const midPoint = step.path ? step.path[Math.floor(step.path.length / 2)] : null;
          if (midPoint) {
            const walkingTime = cumulativeTime - (step.duration.value / 2);
            console.log(`Adding walking midpoint, time from origin: ${Math.round(walkingTime/60)}min`);
            
            transitStops.push({
              location: {
                lat: midPoint.lat(),
                lng: midPoint.lng()
              },
              timeFromTransitUser: walkingTime,
              name: "Walking connection"
            });
          }
        }
      }
    }
    
    // If we didn't find any transit stops, use the transit user's location
    if (transitStops.length === 0) {
      // Try to get driving directions for the driver
      let drivingRoute = null;
      try {
        drivingRoute = await cachedDirectionsService.route(
          {
            origin: driverCoords,
            destination: transitUserCoords,
            travelMode: 'DRIVING' as google.maps.TravelMode,
          }
        );
      } catch (error) {
        console.log("Error getting driving directions to transit user:", error);
      }
      
      // Set the directions based on who is the transit user
      let directionsA = isATransit ? null : drivingRoute;
      let directionsB = isATransit ? drivingRoute : null;
      
      return { 
        midpoint: transitUserCoords, 
        directionsA, 
        directionsB 
      };
    }
    
    console.log(`Transit vs Driving: Found ${transitStops.length} transit stops to evaluate`);
    
    // Calculate driving times from driver to each transit stop in batches
    const stopLocations = transitStops.map(stop => stop.location);
    const drivingResults = await batchCalculateRoutes(
      driverCoords,
      stopLocations,
      'DRIVING' as google.maps.TravelMode
    );
    
    // Process the driving results
    const drivingTimes: number[] = [];
    const drivingDirections: (google.maps.DirectionsResult | null)[] = [];
    
    for (let i = 0; i < transitStops.length; i++) {
      const result = drivingResults[i];
      if (result) {
        const drivingTime = result.routes[0].legs[0].duration?.value || 0;
        drivingTimes.push(drivingTime);
        drivingDirections.push(result);
      } else {
        // If we couldn't get driving directions for this stop, skip it
        drivingTimes.push(999999);
        drivingDirections.push(null);
      }
    }
    
    // Find the stop where transit and driving times are closest
    let bestStopIndex = 0;
    let smallestTimeDiff = Infinity;
    let bestTotalTime = Infinity;
    
    // Log all transit stops and their times for debugging
    for (let i = 0; i < transitStops.length; i++) {
      if (drivingDirections[i]) {
        const transitTime = transitStops[i].timeFromTransitUser;
        const drivingTime = drivingTimes[i];
        const timeDiff = Math.abs(transitTime - drivingTime);
        const totalTime = transitTime + drivingTime;
        
        console.log(`Stop ${i}: Transit time: ${Math.round(transitTime/60)}min, Driving time: ${Math.round(drivingTime/60)}min, Diff: ${Math.round(timeDiff/60)}min, Total: ${Math.round(totalTime/60)}min`);
      }
    }
    
    // First pass: find the stop with minimal time difference
    for (let i = 0; i < transitStops.length; i++) {
      // Only consider stops we have valid driving directions for
      if (drivingDirections[i]) {
        const transitTime = transitStops[i].timeFromTransitUser;
        const drivingTime = drivingTimes[i];
        const timeDiff = Math.abs(transitTime - drivingTime);
        const totalTime = transitTime + drivingTime;
        
        // Store this as a candidate if it has a smaller time difference
        // or if it has a similar difference but lower total travel time
        if (timeDiff < smallestTimeDiff) {
          smallestTimeDiff = timeDiff;
          bestStopIndex = i;
          bestTotalTime = totalTime;
        } else if (timeDiff < smallestTimeDiff + 180 && totalTime < bestTotalTime) {
          // If time diff is within 3 minutes of the best, prefer the stop with lower total time
          bestStopIndex = i;
          bestTotalTime = totalTime;
          smallestTimeDiff = timeDiff;
        }
      }
    }
    
    // Check if we have a reasonable balance (within 10 minutes)
    const acceptableDiffInSeconds = 600; // 10 minutes
    
    if (smallestTimeDiff > acceptableDiffInSeconds && transitStops.length > 5) {
      console.log(`No well-balanced stops found. Best difference was ${Math.round(smallestTimeDiff/60)} minutes`);
      
      // Second pass: use an adaptive bias approach that works for all locations
      // This helps when there's a systematic bias in the data
      const transitTime = transitStops[bestStopIndex].timeFromTransitUser;
      const drivingTime = drivingTimes[bestStopIndex];
      
      // Calculate the time ratio to determine the appropriate bias
      const timeRatio = drivingTime / transitTime;
      
      // Determine bias strength based on the severity of the imbalance
      // More imbalanced = stronger bias correction
      let biasMultiplier = 1.0; // Default: no bias
      
      if (timeRatio < 0.5) {
        // Very severe imbalance (driving time < 50% of transit time)
        biasMultiplier = 0.7; // Strong 30% reduction in transit time for comparison
        console.log(`Severe imbalance detected (driving:transit = 1:${(1/timeRatio).toFixed(1)}), applying strong bias correction`);
      } else if (timeRatio < 0.7) {
        // Significant imbalance (driving time between 50-70% of transit time)
        biasMultiplier = 0.8; // Moderate 20% reduction
        console.log(`Significant imbalance detected (driving:transit = 1:${(1/timeRatio).toFixed(1)}), applying moderate bias correction`);
      } else if (timeRatio < 0.9) {
        // Mild imbalance (driving time between 70-90% of transit time)
        biasMultiplier = 0.9; // Mild 10% reduction
        console.log(`Mild imbalance detected (driving:transit = 1:${(1/timeRatio).toFixed(1)}), applying slight bias correction`);
      } else {
        // No significant imbalance - transit and driving times are already close enough
        console.log(`No significant imbalance (driving:transit = 1:${(1/timeRatio).toFixed(1)}), no bias correction needed`);
      }
      
      // Apply bias correction if we detected an imbalance
      if (biasMultiplier < 1.0) {
        console.log(`Applying bias multiplier: ${biasMultiplier.toFixed(2)} to transit times for comparison`);
        
        let biasedBestIndex = bestStopIndex;
        let biasedSmallestDiff = smallestTimeDiff;
        let biasedBestTotalTime = bestTotalTime;
        
        // First pass: find the stop with minimal biased time difference
        for (let i = 0; i < transitStops.length; i++) {
          if (drivingDirections[i]) {
            const transitTime = transitStops[i].timeFromTransitUser;
            const drivingTime = drivingTimes[i]; 
            const totalTime = transitTime + drivingTime;
            
            // Apply bias to reduce the transit time for comparison purposes only
            const adjustedTransitTime = transitTime * biasMultiplier;
            const biasedDiff = Math.abs(adjustedTransitTime - drivingTime);
            
            if (biasedDiff < biasedSmallestDiff) {
              biasedSmallestDiff = biasedDiff;
              biasedBestIndex = i;
              biasedBestTotalTime = totalTime;
            } else if (biasedDiff < biasedSmallestDiff + 180 && totalTime < biasedBestTotalTime) {
              // If time diff is within 3 minutes of the best, prefer the stop with lower total time
              biasedBestIndex = i;
              biasedBestTotalTime = totalTime;
              biasedSmallestDiff = biasedDiff;
            }
          }
        }
        
        // If we found a better stop with the bias applied, use it
        if (biasedBestIndex !== bestStopIndex) {
          console.log(`Using biased selection: stop ${biasedBestIndex} instead of ${bestStopIndex}`);
          console.log(`Original transit time: ${Math.round(transitStops[bestStopIndex].timeFromTransitUser/60)}min, ` +
                      `driving time: ${Math.round(drivingTimes[bestStopIndex]/60)}min, ` +
                      `difference: ${Math.round(Math.abs(transitStops[bestStopIndex].timeFromTransitUser - drivingTimes[bestStopIndex])/60)}min`);
          console.log(`New transit time: ${Math.round(transitStops[biasedBestIndex].timeFromTransitUser/60)}min, ` +
                      `driving time: ${Math.round(drivingTimes[biasedBestIndex]/60)}min, ` +
                      `difference: ${Math.round(Math.abs(transitStops[biasedBestIndex].timeFromTransitUser - drivingTimes[biasedBestIndex])/60)}min`);
                      
          bestStopIndex = biasedBestIndex;
        }
      }
    }
    
    // Get the best stop
    const bestStop = transitStops[bestStopIndex];
    
    console.log(`Selected best stop${bestStop.name ? ': ' + bestStop.name : ''}`);
    console.log(`Transit time: ${Math.round(bestStop.timeFromTransitUser/60)}min, Driving time: ${Math.round(drivingTimes[bestStopIndex]/60)}min`);
    console.log(`Time difference: ${Math.round(Math.abs(bestStop.timeFromTransitUser - drivingTimes[bestStopIndex])/60)}min`);
    
    // Get the driving directions for the best stop
    const bestDrivingDirections = drivingDirections[bestStopIndex];
    
    try {
      // Calculate transit directions to the best stop
      const transitToStopRoute = await cachedDirectionsService.route(
        {
          origin: transitUserCoords,
          destination: bestStop.location,
          travelMode: 'TRANSIT' as google.maps.TravelMode,
        }
      );
      
      // Set directionsA and directionsB appropriately
      let directionsA: google.maps.DirectionsResult | null;
      let directionsB: google.maps.DirectionsResult | null;
      
      if (isATransit) {
        // User A is using transit, User B is driving
        directionsA = transitToStopRoute;
        directionsB = bestDrivingDirections;
      } else {
        // User A is driving, User B is using transit
        directionsA = bestDrivingDirections;
        directionsB = transitToStopRoute;
      }
      
      return { midpoint: bestStop.location, directionsA, directionsB };
    } catch (error) {
      console.log("Error getting transit directions to best stop:", error);
      
      // If we can't get transit directions, just use driving directions to the transit user
      try {
        const drivingToTransitUserRoute = await cachedDirectionsService.route(
          {
            origin: driverCoords,
            destination: transitUserCoords,
            travelMode: 'DRIVING' as google.maps.TravelMode,
          }
        );
        
        let directionsA = isATransit ? null : drivingToTransitUserRoute;
        let directionsB = isATransit ? drivingToTransitUserRoute : null;
        
        return { 
          midpoint: transitUserCoords, 
          directionsA, 
          directionsB 
        };
      } catch (finalError) {
        console.log("Final fallback - returning midpoint with no directions:", finalError);
        return { midpoint: fallbackMidpoint, directionsA: null, directionsB: null };
      }
    }
  } catch (outerError) {
    console.log("Top-level error in calculateTransitVsDrivingMidpoint:", outerError);
    return { midpoint: fallbackMidpoint, directionsA: null, directionsB: null };
  }
};

// Scenario 5: One user is walking, the other is using public transport
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
  
  console.log(`Walking vs Transit: Walker at ${isAWalking ? 'location A' : 'location B'}`);
  
  // Default: Walker stays in place, transit user gets directions
  let directionsA: google.maps.DirectionsResult | null = null;
  let directionsB: google.maps.DirectionsResult | null = null;
  let midpoint = walkerCoords;
  
  try {
    // Get transit route from transit user to walker using cached service
    const transitRoute = await cachedDirectionsService.route(
      {
        origin: transitUserCoords,
        destination: walkerCoords,
        travelMode: 'TRANSIT' as google.maps.TravelMode,
      }
    );
    
    // If we didn't find a better intermediate stop, use the original plan:
    // walker stays in place, transit user comes to walker
    if (isAWalking) {
      // User A is walking (staying in place), User B is taking transit to A
      directionsA = null; // No directions needed for A since they're already at the midpoint
      directionsB = transitRoute;
    } else {
      // User B is walking (staying in place), User A is taking transit to B
      directionsA = transitRoute;
      directionsB = null; // No directions needed for B since they're already at the midpoint
    }
  } catch (error) {
    console.log("Error getting transit directions to walker:", error);
    // Even if we can't get transit directions, we still use the walker's location as the midpoint
  }
  
  return { midpoint, directionsA, directionsB };
};
