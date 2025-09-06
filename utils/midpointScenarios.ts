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
  // Default to geographic midpoint in case of errors
  const fallbackMidpoint = {
    lat: (coordsA.lat + coordsB.lat) / 2,
    lng: (coordsA.lng + coordsB.lng) / 2
  };
  
  try {
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
      return { midpoint: fallbackMidpoint, directionsA: null, directionsB: null };
    }
    
    // Interpolate to find the exact halfway point
    const segmentDuration = afterPoint.timeFromStart - beforePoint.timeFromStart;
    const segmentProgress = segmentDuration === 0 ? 0 : 
      (halfwayTime - beforePoint.timeFromStart) / segmentDuration;
    
    const midpoint = {
      lat: beforePoint.point.lat + segmentProgress * (afterPoint.point.lat - beforePoint.point.lat),
      lng: beforePoint.point.lng + segmentProgress * (afterPoint.point.lng - beforePoint.point.lng)
    };
    
    try {
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
      transitRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
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
    } catch (error) {
      console.log("No transit route available, falling back to midpoint at transit user location", error);
      
      // If there's no transit route, use the transit user's location as the midpoint
      // This is similar to the walking scenario - we meet where the transit user is
      let directionsA: google.maps.DirectionsResult | null = null;
      let directionsB: google.maps.DirectionsResult | null = null;
      
      try {
        // Get directions for the driver to the transit user
        const drivingRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: driverCoords,
              destination: transitUserCoords,
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
              const numVirtualStops = Math.min(3, Math.floor(linePath.length / 4));
              
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
        drivingRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: driverCoords,
              destination: transitUserCoords,
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
    
    // Calculate driving times from driver to each transit stop
    const drivingTimes: number[] = [];
    const drivingDirections: (google.maps.DirectionsResult | null)[] = [];
    
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
        console.log("Error calculating driving time to stop:", error);
        // If we can't calculate driving time for this stop, use a very high value
        drivingTimes.push(999999);
        drivingDirections.push(null);
      }
    }
    
    // Find the stop where transit and driving times are closest
    let bestStopIndex = 0;
    let smallestTimeDiff = Infinity;
    let bestTotalTime = Infinity;
    
    console.log(`Transit vs Driving: Found ${transitStops.length} transit stops to evaluate`);
    
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
      
      // Second pass: use a bias to favor the transit user if driving times are consistently shorter
      // This helps when there's a systematic bias in the data
      const transitTime = transitStops[bestStopIndex].timeFromTransitUser;
      const drivingTime = drivingTimes[bestStopIndex];
      
      // If driving time is much shorter than transit time, look for stops that favor the driver more
      // (i.e., increase driver's time to balance with transit user)
      if (drivingTime < transitTime * 0.7) { // If driving time is less than 70% of transit time
        console.log("Driving times are consistently shorter - applying bias to favor transit user");
        
        let biasedBestIndex = bestStopIndex;
        let biasedSmallestDiff = smallestTimeDiff;
        
        for (let i = 0; i < transitStops.length; i++) {
          if (drivingDirections[i]) {
            const transitTime = transitStops[i].timeFromTransitUser;
            const drivingTime = drivingTimes[i]; 
            
            // Apply a bias to reduce the transit time for comparison purposes
            const adjustedTransitTime = transitTime * 0.85; // Reduce transit time by 15%
            const biasedDiff = Math.abs(adjustedTransitTime - drivingTime);
            
            if (biasedDiff < biasedSmallestDiff) {
              biasedSmallestDiff = biasedDiff;
              biasedBestIndex = i;
            }
          }
        }
        
        // If we found a better stop with the bias applied, use it
        if (biasedBestIndex !== bestStopIndex) {
          console.log(`Using biased selection: stop ${biasedBestIndex} instead of ${bestStopIndex}`);
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
      
      // Verify the actual times from the directions
      const actualTransitTime = transitToStopRoute.routes[0].legs[0].duration?.value || 0;
      const actualDrivingTime = bestDrivingDirections?.routes[0]?.legs[0]?.duration?.value || 0;
      const actualTimeDiff = Math.abs(actualTransitTime - actualDrivingTime);
      
      console.log(`VERIFICATION - Actual transit time: ${Math.round(actualTransitTime/60)}min, Actual driving time: ${Math.round(actualDrivingTime/60)}min`);
      console.log(`VERIFICATION - Actual time difference: ${Math.round(actualTimeDiff/60)}min`);
      
      // If our estimation was way off, we should log this but still use the best stop we found
      if (Math.abs(actualTimeDiff - smallestTimeDiff) > 300) { // > 5 minutes different from our estimation
        console.log("⚠️ Warning: Estimated and actual time differences don't match!");
      }
      
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
        const drivingToTransitUserRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: driverCoords,
              destination: transitUserCoords,
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
  
  console.log(`Walking vs Transit: Walker at ${isAWalking ? 'location A' : 'location B'}`);
  
  // Default: Walker stays in place, transit user gets directions
  let directionsA: google.maps.DirectionsResult | null = null;
  let directionsB: google.maps.DirectionsResult | null = null;
  let midpoint = walkerCoords;
  
  try {
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
    
    // Calculate the transit time
    const transitTime = transitRoute.routes[0].legs[0].duration?.value || 0;
    console.log(`Transit time to walker: ${Math.round(transitTime/60)} minutes`);
    
    // Check if the transit time is very long - if so, consider meeting at an intermediate stop
    if (transitTime > 2700) { // If transit time is over 45 minutes
      console.log("Transit time is very long, checking if we can meet at an intermediate stop");
      
      // Extract transit stops with their travel times
      interface TransitStop {
        location: google.maps.LatLngLiteral;
        timeFromTransitUser: number;
        name?: string;
      }
      
      const transitStops: TransitStop[] = [];
      let cumulativeTime = 0;
      
      // Process each step in the transit route
      const transitSteps = transitRoute.routes[0].legs[0].steps;
      for (const step of transitSteps) {
        // We're only interested in steps that involve transit (bus, train, etc.)
        if (step.travel_mode === "TRANSIT") {
          const transitName = step.transit?.line?.short_name || 
                            step.transit?.line?.name || 
                            "transit";
          
          // Add departure stop
          if (step.transit?.departure_stop?.location) {
            const stopName = step.transit.departure_stop.name || "Unknown Stop";
            
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
            
            transitStops.push({
              location: {
                lat: step.transit.arrival_stop.location.lat(),
                lng: step.transit.arrival_stop.location.lng()
              },
              timeFromTransitUser: cumulativeTime,
              name: stopName
            });
          }
        } else {
          // For non-transit steps, just update time
          cumulativeTime += step.duration?.value || 0;
        }
      }
      
      // Look for a stop that's closer to the halfway point of the journey
      if (transitStops.length > 2) {
        const desiredTime = transitTime * 0.6; // Target: transit user travels 60% of their original time
        let bestStop = null;
        let bestTimeDiff = Infinity;
        
        for (const stop of transitStops) {
          const timeDiff = Math.abs(stop.timeFromTransitUser - desiredTime);
          if (timeDiff < bestTimeDiff) {
            bestTimeDiff = timeDiff;
            bestStop = stop;
          }
        }
        
        if (bestStop) {
          console.log(`Found better intermediate stop: ${bestStop.name}, at ${Math.round(bestStop.timeFromTransitUser/60)} minutes from transit user`);
          
          // Calculate walking time for walker to this stop
          try {
            const walkRoute = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route(
                {
                  origin: walkerCoords,
                  destination: bestStop.location,
                  travelMode: 'WALKING' as google.maps.TravelMode,
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
            
            const walkTime = walkRoute.routes[0].legs[0].duration?.value || 0;
            console.log(`Walker time to intermediate stop: ${Math.round(walkTime/60)} minutes`);
            
            // If walker's time is reasonable (<30 min) and better balanced, use this stop
            if (walkTime < 1800 && Math.abs(walkTime - bestStop.timeFromTransitUser) < transitTime) {
              console.log("Using intermediate stop as midpoint");
              
              // Calculate transit directions to this stop
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
              
              // Update midpoint and directions
              midpoint = bestStop.location;
              if (isAWalking) {
                directionsA = walkRoute;
                directionsB = transitToStopRoute;
              } else {
                directionsA = transitToStopRoute;
                directionsB = walkRoute;
              }
              
              // Use this intermediate point rather than the walker's location
              return { midpoint, directionsA, directionsB };
            }
          } catch (error) {
            console.log("Error calculating walking route to intermediate stop:", error);
          }
        }
      }
    }
    
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
