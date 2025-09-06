# API Optimization

This document outlines the changes made to optimize Google Maps API usage in the Between Friends application.

## Problem

The original implementation made multiple individual API calls to the Google Maps Directions API and Places API without any caching or batching. This resulted in:

1. Excessive API usage, especially for transit/driving calculations
2. Repeated API calls for the same routes
3. Potential rate limiting issues
4. Higher costs due to unnecessary API calls

## Solution

We've implemented several optimizations:

### 1. API Response Caching

The `apiCache.ts` utility provides caching for both Directions API and Places API responses:

- Caches responses based on origin, destination, and travel mode
- Uses a 5-minute Time-To-Live (TTL) for cached items
- Handles both LatLngLiteral and LatLng object types
- Logs cache hits and misses for monitoring

### 2. Request Batching and Queuing

For scenarios where multiple API calls are needed (like checking multiple transit stops):

- Groups similar requests to be processed with a small delay between them
- Avoids triggering rate limits while still processing multiple requests
- Uses Promise.all for parallel execution when appropriate
- Especially useful for the transit vs. driving scenario where many transit stops need evaluation

### 3. Optimized Transit Stop Processing

Improved the transit stop extraction process:

- Extracts transit stops once and reuses them
- Batches driving time calculations to transit stops 
- Uses Promise.all for parallel API requests when possible

### 4. Cached Service Implementations

Created cached versions of Google's services:

- `cachedDirectionsService`: Drop-in replacement for the standard DirectionsService
- `cachedPlacesService`: Drop-in replacement for PlacesService
- Both automatically handle caching without requiring code changes elsewhere

## Implementation Details

### Key Files

- `apiCache.ts`: Core caching implementation
- `batchRoutes.ts`: Helper functions for batch processing routes
- `optimizedMidpointScenarios.ts`: Optimized versions of midpoint calculation logic
- `optimizedMapCalculations.ts`: Optimized map calculation functions
- `OptimizedMapContext.tsx`: Context using optimized functions

### Usage

To use the optimized versions:

1. Import from optimized files:
   ```typescript
   import { calculateTimeMidpoint } from '../utils/optimizedMapCalculations';
   ```

2. Use the OptimizedMapContext:
   ```tsx
   import { MapProvider } from '../contexts/OptimizedMapContext';
   ```

## Benefits

- **Reduced API Calls**: Caching prevents redundant API calls for the same routes
- **Improved Performance**: Faster responses for previously calculated routes
- **Cost Savings**: Significant reduction in API usage
- **Better User Experience**: Faster loading times for repeat searches
- **Stability**: Rate limiting is less likely due to controlled request pacing

## Implementation Notes

The caching system uses an in-memory cache that persists for the duration of the user session. For a production environment, consider:

1. Using localStorage or IndexedDB for persisting cache between sessions
2. Adding a cache invalidation strategy for longer user sessions
3. Implementing more sophisticated request batching for high-traffic applications

## Future Improvements

1. Add usage metrics to track cache hit/miss rates
2. Implement a more advanced batching strategy that considers route similarity
3. Add cache compression for larger response payloads
4. Consider using service workers for offline caching
