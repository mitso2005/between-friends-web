/**
 * Utilities for testing API call counts
 */
import { getApiCallStats, resetApiCallStats, ApiCallStats } from './apiCache';

/**
 * Log the current API call statistics to the console
 */
export const logApiCallStats = (): ApiCallStats => {
  const stats = getApiCallStats();
  
  console.group('API Call Statistics');
  console.log('┌───────────────────────────────────────────┐');
  console.log('│              API CALL STATS               │');
  console.log('├───────────────────────────────────────────┤');
  console.log(`│ Directions API                            │`);
  console.log(`│   Total Requests:     ${stats.totalDirectionsRequests.toString().padStart(5, ' ')}              │`);
  console.log(`│   Cache Hits:         ${stats.cachedDirectionsHits.toString().padStart(5, ' ')}              │`);
  console.log(`│   Actual API Calls:   ${stats.actualDirectionsApiCalls.toString().padStart(5, ' ')}              │`);
  console.log(`│   Cache Hit Rate:     ${stats.totalDirectionsRequests ? 
    Math.round((stats.cachedDirectionsHits / stats.totalDirectionsRequests) * 100).toString().padStart(3, ' ') : '  0'}%             │`);
  console.log('├───────────────────────────────────────────┤');
  console.log(`│ Places API                                │`);
  console.log(`│   Total Requests:     ${stats.totalPlacesRequests.toString().padStart(5, ' ')}              │`);
  console.log(`│   Cache Hits:         ${stats.cachedPlacesHits.toString().padStart(5, ' ')}              │`);
  console.log(`│   Actual API Calls:   ${stats.actualPlacesApiCalls.toString().padStart(5, ' ')}              │`);
  console.log(`│   Cache Hit Rate:     ${stats.totalPlacesRequests ? 
    Math.round((stats.cachedPlacesHits / stats.totalPlacesRequests) * 100).toString().padStart(3, ' ') : '  0'}%             │`);
  console.log('└───────────────────────────────────────────┘');
  console.groupEnd();
  
  return stats;
};

/**
 * Run a test scenario and log the API call statistics
 * @param description Description of the test scenario
 * @param testFn Function containing the test scenario to run
 */
export const testApiCalls = async (
  description: string,
  testFn: () => Promise<void>
): Promise<ApiCallStats> => {
  console.log(`\n🧪 TESTING: ${description}`);
  
  // Reset counters before test
  resetApiCallStats();
  
  // Run the test scenario
  await testFn();
  
  // Log the results
  const stats = logApiCallStats();
  
  return stats;
};

/**
 * Compare API call stats to expected values
 * @param actual Actual API call stats
 * @param expected Expected API call stats (partial)
 */
export const validateApiCallStats = (
  actual: ApiCallStats,
  expected: Partial<ApiCallStats>
): boolean => {
  let isValid = true;
  const failures: string[] = [];
  
  Object.entries(expected).forEach(([key, value]) => {
    const actualValue = actual[key as keyof ApiCallStats];
    if (actualValue !== value) {
      isValid = false;
      failures.push(`${key}: expected ${value}, got ${actualValue}`);
    }
  });
  
  if (isValid) {
    console.log('✅ API call validation passed!');
  } else {
    console.log('❌ API call validation failed:');
    failures.forEach(failure => console.log(`   - ${failure}`));
  }
  
  return isValid;
};

/**
 * Add API call tracking to a component
 * This can be used to create a simple UI display of API call counts
 */
export const createApiCallMonitor = () => {
  // Return an object with methods to get the current stats and reset them
  return {
    getStats: getApiCallStats,
    resetStats: resetApiCallStats,
    logStats: logApiCallStats
  };
};
