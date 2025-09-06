/**
 * Cache for Google Maps API results to minimize API calls
 */

// Type for cache keys
type CacheKey = string;

// Interface for cached items with expiration
interface CachedItem<T> {
  data: T;
  timestamp: number;
}

// Generic type for our various caches
interface Cache<T> {
  [key: CacheKey]: CachedItem<T>;
}

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Initialize our caches
const directionsCache: Cache<google.maps.DirectionsResult> = {};
const placesCache: Cache<google.maps.places.PlaceResult[]> = {};

/**
 * Create a cache key for directions requests
 */
export const createDirectionsCacheKey = (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  travelMode: google.maps.TravelMode
): CacheKey => {
  return `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}-${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}-${travelMode}`;
};

/**
 * Create a cache key for places requests
 */
export const createPlacesCacheKey = (
  location: google.maps.LatLngLiteral,
  type: string,
  radius: number
): CacheKey => {
  return `${location.lat.toFixed(5)},${location.lng.toFixed(5)}-${type}-${radius}`;
};

/**
 * Check if a cached item is still valid
 */
const isCacheValid = <T>(cachedItem: CachedItem<T> | undefined): boolean => {
  if (!cachedItem) return false;
  return Date.now() - cachedItem.timestamp < CACHE_TTL;
};

/**
 * Cache directions results and retrieve cached results
 */
export const getCachedDirections = (
  key: CacheKey
): google.maps.DirectionsResult | null => {
  const cached = directionsCache[key];
  if (isCacheValid(cached)) {
    console.log("🔄 Using cached directions");
    return cached.data;
  }
  return null;
};

export const cacheDirections = (
  key: CacheKey,
  data: google.maps.DirectionsResult
): void => {
  directionsCache[key] = {
    data,
    timestamp: Date.now(),
  };
};

/**
 * Cache places results and retrieve cached results
 */
export const getCachedPlaces = (
  key: CacheKey
): google.maps.places.PlaceResult[] | null => {
  const cached = placesCache[key];
  if (isCacheValid(cached)) {
    console.log("🔄 Using cached places");
    return cached.data;
  }
  return null;
};

export const cachePlaces = (
  key: CacheKey,
  data: google.maps.places.PlaceResult[]
): void => {
  placesCache[key] = {
    data,
    timestamp: Date.now(),
  };
};

/**
 * Cached directions service implementation
 */
export const cachedDirectionsService = {
  route: async (
    request: google.maps.DirectionsRequest,
    callback?: (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => void
  ): Promise<google.maps.DirectionsResult> => {
    if (!request.origin || !request.destination || !request.travelMode) {
      throw new Error("Invalid directions request");
    }
    
    // Create origin and destination literals
    let origin: google.maps.LatLngLiteral;
    if (typeof request.origin === 'string') {
      origin = { lat: 0, lng: 0 }; // We don't handle string origins for caching
    } else if ('lat' in request.origin && typeof request.origin.lat === 'number') {
      origin = request.origin as google.maps.LatLngLiteral;
    } else {
      const latLng = request.origin as google.maps.LatLng;
      origin = { lat: latLng.lat(), lng: latLng.lng() };
    }
    
    let destination: google.maps.LatLngLiteral;
    if (typeof request.destination === 'string') {
      destination = { lat: 0, lng: 0 }; // We don't handle string destinations for caching
    } else if ('lat' in request.destination && typeof request.destination.lat === 'number') {
      destination = request.destination as google.maps.LatLngLiteral;
    } else {
      const latLng = request.destination as google.maps.LatLng;
      destination = { lat: latLng.lat(), lng: latLng.lng() };
    }
    
    // Skip caching for string locations as we can't generate a reliable cache key
    if (typeof request.origin === 'string' || typeof request.destination === 'string') {
      const directionsService = new google.maps.DirectionsService();
      return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            if (callback) callback(result, status);
            resolve(result);
          } else {
            if (callback) callback(null, status);
            reject(status);
          }
        });
      });
    }
    
    // Create cache key
    const cacheKey = createDirectionsCacheKey(
      origin,
      destination,
      request.travelMode
    );
    
    // Check cache
    const cachedResult = getCachedDirections(cacheKey);
    if (cachedResult) {
      if (callback) callback(cachedResult, google.maps.DirectionsStatus.OK);
      return cachedResult;
    }
    
    // Make actual API call
    const directionsService = new google.maps.DirectionsService();
    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Cache the result
          cacheDirections(cacheKey, result);
          if (callback) callback(result, status);
          resolve(result);
        } else {
          if (callback) callback(null, status);
          reject(status);
        }
      });
    });
  }
};

/**
 * Cached places service implementation
 */
export const cachedPlacesService = {
  nearbySearch: async (
    request: google.maps.places.PlaceSearchRequest,
    callback?: (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => void
  ): Promise<google.maps.places.PlaceResult[]> => {
    if (!request.location || !request.type) {
      throw new Error("Invalid places request");
    }
    
    // Create location literal
    let location: google.maps.LatLngLiteral;
    if ('lat' in request.location && typeof request.location.lat === 'number') {
      location = request.location as google.maps.LatLngLiteral;
    } else {
      const latLng = request.location as google.maps.LatLng;
      location = { lat: latLng.lat(), lng: latLng.lng() };
    }
    
    // Create cache key
    const cacheKey = createPlacesCacheKey(
      location,
      request.type.toString(),
      request.radius || 500
    );
    
    // Check cache
    const cachedResults = getCachedPlaces(cacheKey);
    if (cachedResults) {
      if (callback) callback(cachedResults, google.maps.places.PlacesServiceStatus.OK);
      return cachedResults;
    }
    
    // Make actual API call
    const placesService = new google.maps.places.PlacesService(
      document.createElement('div')
    );
    
    return new Promise((resolve, reject) => {
      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Cache the results
          cachePlaces(cacheKey, results);
          if (callback) callback(results, status);
          resolve(results);
        } else {
          if (callback) callback(null, status);
          resolve([]);
        }
      });
    });
  }
};

/**
 * Request queue for batching similar requests
 */
interface QueuedRequest {
  request: google.maps.DirectionsRequest;
  resolve: (result: google.maps.DirectionsResult) => void;
  reject: (error: any) => void;
}

// Simple API request throttling/batching
const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

// Process the queue of requests
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  // Process requests with a small delay between them
  while (requestQueue.length > 0) {
    const { request, resolve, reject } = requestQueue.shift()!;
    
    try {
      // Use our cached service
      const result = await cachedDirectionsService.route(request);
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    // Small delay to avoid rate limits
    if (requestQueue.length > 0) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  isProcessingQueue = false;
};

/**
 * Queue a directions request for batching
 */
export const queueDirectionsRequest = (
  request: google.maps.DirectionsRequest
): Promise<google.maps.DirectionsResult> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ request, resolve, reject });
    processQueue();
  });
};
