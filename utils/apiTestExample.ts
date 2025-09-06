/**
 * Example of how to test API call counts
 * This is for demonstration purposes only
 */
import { testApiCalls, validateApiCallStats } from './apiTestUtils';
import { cachedDirectionsService, cachedPlacesService } from './apiCache';

/**
 * Example test scenario
 */
export const runApiCallTests = async () => {
  // Example test case
  await testApiCalls('First request should make API calls', async () => {
    // Make a sample directions request
    try {
      await cachedDirectionsService.route({
        origin: { lat: 40.712776, lng: -74.005974 }, // NYC
        destination: { lat: 34.052235, lng: -118.243683 }, // LA
        travelMode: "DRIVING" as google.maps.TravelMode
      });
    } catch (error) {
      console.error('Error in test directions call:', error);
    }
  });

  // Example test case for cache hit
  await testApiCalls('Second identical request should use cache', async () => {
    try {
      await cachedDirectionsService.route({
        origin: { lat: 40.712776, lng: -74.005974 }, // NYC
        destination: { lat: 34.052235, lng: -118.243683 }, // LA
        travelMode: "DRIVING" as google.maps.TravelMode
      });
      
      // Validate the expected stats
      validateApiCallStats(await import('./apiCache').then(m => m.getApiCallStats()), {
        totalDirectionsRequests: 1,
        cachedDirectionsHits: 1,
        actualDirectionsApiCalls: 0
      });
    } catch (error) {
      console.error('Error in test directions call:', error);
    }
  });
};

/**
 * Hook for adding API monitoring to a component
 * 
 * Example usage in a component:
 * 
 * ```tsx
 * import { useApiMonitor } from './apiTestExample';
 * 
 * const MyComponent = () => {
 *   const apiMonitor = useApiMonitor();
 *   
 *   return (
 *     <div>
 *       <button onClick={() => apiMonitor.logStats()}>Show API Stats</button>
 *       <button onClick={() => apiMonitor.resetStats()}>Reset Stats</button>
 *     </div>
 *   );
 * };
 * ```
 */
export const useApiMonitor = () => {
  // In a React component, you would use useEffect or a button to trigger this
  const { createApiCallMonitor } = require('./apiTestUtils');
  return createApiCallMonitor();
};

/**
 * Example of how to run API call monitoring in the browser console
 * 
 * To use in browser console:
 * 1. Import the module: import * as apiTest from './utils/apiTestExample';
 * 2. Run tests: apiTest.runApiCallTests();
 * 3. Or get current stats: apiTest.getConsoleMonitor().logStats();
 */
export const getConsoleMonitor = () => {
  const { createApiCallMonitor } = require('./apiTestUtils');
  return createApiCallMonitor();
};
