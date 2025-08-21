"use client";
import React, { useRef, useState, useEffect } from "react";
import { useJsApiLoader, Libraries } from "@react-google-maps/api";
import { TransportMode } from "../components/TransportModeSelector";
import { MapView } from "../components/MapView";
import { SearchPanel } from "../components/SearchPanel";

// Define libraries array outside the component to prevent recreation on each render
// This fixes the "Performance warning! LoadScript has been reloaded unintentionally!"
const libraries: Libraries = ["places"];

export default function Home() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [locationA, setLocationA] = useState("");
  const [locationB, setLocationB] = useState("");
  const [coordsA, setCoordsA] = useState<google.maps.LatLngLiteral | null>(null);
  const [coordsB, setCoordsB] = useState<google.maps.LatLngLiteral | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [midpoint, setMidpoint] = useState<google.maps.LatLngLiteral | null>(null);
  const [transportModeA, setTransportModeA] = useState<TransportMode>("DRIVING");
  const [transportModeB, setTransportModeB] = useState<TransportMode>("DRIVING");
  const [timeMidpoint, setTimeMidpoint] = useState<google.maps.LatLngLiteral | null>(null);
  const [directionsA, setDirectionsA] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsB, setDirectionsB] = useState<google.maps.DirectionsResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);

  const autocompleteA = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteB = useRef<google.maps.places.Autocomplete | null>(null);

  // Update autocomplete bias when map bounds change
  const updateAutocompleteBias = (bounds: google.maps.LatLngBounds) => {
    if (autocompleteA.current) {
      autocompleteA.current.setBounds(bounds);
    }
    if (autocompleteB.current) {
      autocompleteB.current.setBounds(bounds);
    }
  };

  // Handle map bounds change
  const onBoundsChanged = () => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds(bounds);
        updateAutocompleteBias(bounds);
      }
    }
  };

  const onPlaceChangedA = () => {
    if (autocompleteA.current) {
      const place = autocompleteA.current.getPlace();
      if (place.geometry?.location) {
        const newCoords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCoordsA(newCoords);
        setLocationA(place.formatted_address || place.name || "");
        
        // Pan map to show the new location
        if (map) {
          map.panTo(newCoords);
        }
      }
    }
  };

  const onPlaceChangedB = () => {
    if (autocompleteB.current) {
      const place = autocompleteB.current.getPlace();
      if (place.geometry?.location) {
        const newCoords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCoordsB(newCoords);
        setLocationB(place.formatted_address || place.name || "");
        
        // Pan map to show the new location
        if (map) {
          map.panTo(newCoords);
        }
      }
    }
  };
  
  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Set initial bounds for autocomplete
    const bounds = mapInstance.getBounds();
    if (bounds) {
      setMapBounds(bounds);
      updateAutocompleteBias(bounds);
    }
  };

  const onAutocompleteLoadA = (ac: google.maps.places.Autocomplete) => {
    autocompleteA.current = ac;
    
    // Set initial autocomplete options - no country restriction for global use
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"],
    });

    // Apply current map bounds if available
    if (mapBounds) {
      ac.setBounds(mapBounds);
    }
  };

  const onAutocompleteLoadB = (ac: google.maps.places.Autocomplete) => {
    autocompleteB.current = ac;
    
    ac.setOptions({
      fields: ["geometry", "formatted_address", "name"],
      types: ["establishment", "geocode"],
    });

    if (mapBounds) {
      ac.setBounds(mapBounds);
    }
  };

  // Handle input changes without interfering with Autocomplete
  const handleInputAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationA(e.target.value);
  };

  const handleInputBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationB(e.target.value);
  };

  // Fit map to show both markers when both locations are selected
  useEffect(() => {
    if (map && coordsA && coordsB) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(coordsA);
      bounds.extend(coordsB);
      map.fitBounds(bounds);
      
      // Add some padding
      const padding = { top: 100, right: 50, bottom: 50, left: 350 };
      map.fitBounds(bounds, padding);
    }
  }, [map, coordsA, coordsB]);

  // Calculate time-based midpoint and routes with optimized algorithm
  const calculateTimeMidpoint = async () => {
    if (!coordsA || !coordsB) return;
    
    setIsCalculating(true);
    setCalculationError(null);
    setApiKeyError(false);
    
    try {
      // First calculate distance-based midpoint as a starting point
      const distanceMidpoint = {
        lat: (coordsA.lat + coordsB.lat) / 2,
        lng: (coordsA.lng + coordsB.lng) / 2
      };
      setMidpoint(distanceMidpoint); // Keep the distance midpoint for debugging
      
      // Create directions service
      const directionsService = new google.maps.DirectionsService();
      
      try {
        // First test if the directions service works with our API key
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
                // If this fails with REQUEST_DENIED, it's likely an API key issue
                if (status === "REQUEST_DENIED") {
                  setApiKeyError(true);
                  reject(new Error("API key not authorized for Directions API"));
                } else {
                  reject(status);
                }
              }
            }
          );
        });
      } catch (error: any) {
        // If we hit an API key error, fall back to using the geographic midpoint
        if (error.message === "API key not authorized for Directions API" || 
            (typeof error === 'string' && error === "REQUEST_DENIED")) {
          setApiKeyError(true);
          // Use the geographic midpoint as fallback
          setTimeMidpoint(distanceMidpoint);
          return; // Exit early with the fallback solution
        }
        // For other errors, continue with the algorithm
      }
      
      // If we get here, the API key works for directions

      // Significantly reduced set of points to check (just 3 strategic points)
      const potentialPoints: google.maps.LatLngLiteral[] = [
        // Distance midpoint
        distanceMidpoint,
        // Point closer to A
        {
          lat: coordsA.lat * 0.75 + coordsB.lat * 0.25,
          lng: coordsA.lng * 0.75 + coordsB.lng * 0.25
        },
        // Point closer to B
        {
          lat: coordsA.lat * 0.25 + coordsB.lat * 0.75,
          lng: coordsA.lng * 0.25 + coordsB.lng * 0.75
        }
      ];
      
      let bestPoint = distanceMidpoint; // Default to distance midpoint
      let bestTimeDiff = Infinity;
      let routeA = null;
      let routeB = null;
      
      // We only need to check a few points, not a whole grid
      for (const point of potentialPoints) {
        try {
          // Get both routes in parallel to reduce wait time
          const [resultA, resultB] = await Promise.all([
            // Get route from A to point
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
            
            // Get route from B to point
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
          
          // Get travel times in seconds
          const timeA = resultA.routes[0].legs[0].duration?.value || 0;
          const timeB = resultB.routes[0].legs[0].duration?.value || 0;
          
          // Calculate time difference
          const timeDiff = Math.abs(timeA - timeB);
          
          // Update if this is the best point found so far
          if (timeDiff < bestTimeDiff) {
            bestTimeDiff = timeDiff;
            bestPoint = point;
            routeA = resultA;
            routeB = resultB;
          }
          
          // If we found a point with acceptable time difference (within 10%), stop searching
          const maxTime = Math.max(timeA, timeB);
          if (timeDiff / maxTime < 0.1) { // 10% margin of error
            break; // This point is good enough
          }
        } catch (error) {
          console.log("Error calculating route for point:", point, error);
          // Continue with the next point
        }
      }
      
      // If we didn't find a good point, do a binary search between the best two points
      if (bestTimeDiff > 0 && routeA && routeB) {
        const timeA = routeA.routes[0].legs[0].duration?.value || 0;
        const timeB = routeB.routes[0].legs[0].duration?.value || 0;
        
        // If time difference is significant, try one more point in between
        if (Math.abs(timeA - timeB) / Math.max(timeA, timeB) > 0.2) { // 20% difference
          // If A takes longer, move point closer to A
          // If B takes longer, move point closer to B
          const ratio = timeA > timeB ? 0.4 : 0.6; // Weigh toward the slower route
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
      
      // Set the results
      setTimeMidpoint(bestPoint);
      setDirectionsA(routeA);
      setDirectionsB(routeB);
      
      // Fit map to show both routes
      if (map && routeA && routeB) {
        const bounds = new google.maps.LatLngBounds();
        
        // Add all points from both routes to the bounds
        routeA.routes[0].overview_path.forEach((point) => bounds.extend(point));
        routeB.routes[0].overview_path.forEach((point) => bounds.extend(point));
        
        map.fitBounds(bounds);
        
        // Add some padding
        const padding = { top: 100, right: 50, bottom: 50, left: 350 };
        map.fitBounds(bounds, padding);
      }
    } catch (error) {
      console.error("Error calculating time midpoint:", error);
      if (error === "REQUEST_DENIED" || (error as any)?.message?.includes("API key")) {
        setApiKeyError(true);
        setCalculationError("Your Google Maps API key is not authorized for the Directions Service. Using geographic midpoint instead.");
        
        // Fall back to the geographic midpoint
        if (coordsA && coordsB) {
          const fallbackMidpoint = {
            lat: (coordsA.lat + coordsB.lat) / 2,
            lng: (coordsA.lng + coordsB.lng) / 2
          };
          setTimeMidpoint(fallbackMidpoint);
        }
      } else {
        setCalculationError("Error calculating meeting point. Please try again.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Don't automatically calculate midpoint when transport modes change
  useEffect(() => {
    // Disabled to prevent excessive API calls
  }, [transportModeA, transportModeB]);

  if (!isLoaded) return <div>Loading Maps API...</div>;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Search Panel Component */}
      <SearchPanel
        locationA={locationA}
        locationB={locationB}
        handleInputAChange={handleInputAChange}
        handleInputBChange={handleInputBChange}
        onPlaceChangedA={onPlaceChangedA}
        onPlaceChangedB={onPlaceChangedB}
        onAutocompleteLoadA={onAutocompleteLoadA}
        onAutocompleteLoadB={onAutocompleteLoadB}
        coordsA={coordsA}
        coordsB={coordsB}
        transportModeA={transportModeA}
        transportModeB={transportModeB}
        setTransportModeA={setTransportModeA}
        setTransportModeB={setTransportModeB}
        apiKeyError={apiKeyError}
        calculationError={calculationError}
        isCalculating={isCalculating}
        calculateTimeMidpoint={calculateTimeMidpoint}
        directionsA={directionsA}
        directionsB={directionsB}
        timeMidpoint={timeMidpoint}
        mapBounds={mapBounds}
      />
      
      {/* Map View Component */}
      <MapView
        isLoaded={isLoaded}
        map={map}
        setMap={setMap}
        onLoad={onLoad}
        onBoundsChanged={onBoundsChanged}
        coordsA={coordsA}
        coordsB={coordsB}
        locationA={locationA}
        locationB={locationB}
        midpoint={midpoint}
        timeMidpoint={timeMidpoint}
        directionsA={directionsA}
        directionsB={directionsB}
        apiKeyError={apiKeyError}
      />
    </div>
  );
}