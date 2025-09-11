# Between Friends

![Between Friends](public/logo.png)

A smart web application that helps people find optimal meeting places between different locations. Whether you're meeting up with friends, planning business meetings, or coordinating family gatherings, Between Friends makes it easy to find convenient locations that balance travel times for everyone.

## Table of Contents

- [Bugs and Fixes](#bugs-and-fixes)
- [Roadmap](#roadmap)
- [Features](#features)
- [Technical Overview](#technical-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Google Maps API Integration](#google-maps-api-integration)
- [API Call Optimization](#api-call-optimization)
- [Midpoint Calculation Logic](#midpoint-calculation-logic)
- [User Interface Components](#user-interface-components)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Performance Optimization](#performance-optimization)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Bugs and Fixes

Midpoint Logic:
 - Transit/Transit not working correctly, South Yarra - Frankston returns no results, need to clock to shared station or pick midpoint between closest stations
 - Revise car/transit logic to allow for more flexible routing options. Transit options that move in the direction of the driver should be prioritised, then drivers can meet transit users at a stop along their route.

## Roadmap
1. Fix midpoint logic bugs, case where users don't share a stop
2. Need to allow up to two routes for car/car transit midpoints
3. Link up Supabase backend for user accounts and saving preferences/history
4. Add ability to save favorite locations and meeting spots
5. **LAUNCH VERSION 1.0**
6. Add stripe payments for premium features
7. Add ability to share meeting spots via link or social media
8. Add ability to set a time for the meeting and factor in transit schedules
9. Add cycling and rideshare transport modes

## Features

- **Location Input**: Easily input multiple starting locations using address search or map clicks
- **Multi-Modal Transport**: Support for different transportation modes (driving, transit, walking)
- **Smart Midpoint Calculation**: Find optimal meeting points that minimize travel time for all parties
- **Place Category Filtering**: Filter meeting points by type (restaurants, cafes, parks, etc.)
- **Interactive Map View**: Visualize all routes and potential meeting places
- **Travel Time Balancing**: Automatically balance travel times for mixed transportation modes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Routes and recommendations update as inputs change

## Technical Overview

Between Friends is built using modern web technologies:

- **Frontend Framework**: [Next.js](https://nextjs.org/) with React 18 and TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Mapping**: Google Maps JavaScript API and React components
- **State Management**: React Context API
- **Routing**: Next.js App Router
- **Deployment**: Vercel

## Architecture

The application uses a client-side architecture with three core systems:

1. **Map Integration Layer**: Handles all interactions with the Google Maps APIs
2. **Midpoint Calculation Engine**: Computes optimal meeting points
3. **User Interface Layer**: Provides an intuitive interface for inputs and results

### Key Technical Concepts

- **React Context**: Central state management for map data and location information
- **Custom Hooks**: Encapsulated logic for map operations and calculations
- **API Optimization**: Advanced caching and batching to reduce API calls
- **Geospatial Algorithms**: Mathematical calculations for finding optimal midpoints

## Getting Started

### Set up your environment

1. **Set up your Google Maps API Key**:
   - Create a Google Maps API key in the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/)
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Directions API
   - Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/mitso2005/between-friends-web.git
   cd between-friends-web
   ```

3. **Install dependencies and run the development server**:
   ```bash
   npm install
   npm run dev
   # or
   yarn install
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Google Maps API Integration

The application uses several Google Maps services:

- **Maps JavaScript API**: For rendering the map interface
- **Places API**: For location search and place details
- **Directions API**: For calculating routes and travel times

### Google Maps Context

The application uses a centralized context (`googleMapsContext.tsx`) to manage Google Maps API loading and access throughout the application. This ensures:

- The API is only loaded once
- All components have access to the same API instance
- Loading state is managed consistently

```tsx
// Example usage of Google Maps context
const MyComponent = () => {
  const { isLoaded, isLoading, error } = useGoogleMaps();
  
  if (isLoading) return <div>Loading Maps...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Map is ready to use!</div>;
};
```

## API Call Optimization

To minimize API usage and optimize performance, the application implements:

### 1. API Caching System

The `apiCache.ts` module provides:

- In-memory caching of API responses with a 5-minute TTL
- Separate caches for directions and places requests
- Cache key generation based on request parameters
- Tracking of cache hit rates and API call counts

```typescript
// Example of cache usage
const cachedResult = getCachedDirections(cacheKey);
if (cachedResult) {
  // Use cached result
} else {
  // Make API call and cache the result
  const result = await makeApiCall();
  cacheDirections(cacheKey, result);
}
```

### 2. Request Batching

The application batches similar API requests to avoid rate limiting:

- Requests are queued and processed with a small delay
- Similar requests are combined where possible
- Background processing of queued requests

### 3. API Call Monitoring

A built-in monitoring system (`apiTestUtils.ts` and `ApiMonitor.tsx`) provides:

- Real-time tracking of API call counts
- Cache hit rate visualization
- Testing utilities for API optimization

To test the API call optimization:

1. Navigate to [http://localhost:3000/test-api-calls](http://localhost:3000/test-api-calls)
2. Use the test buttons to make API requests and observe the metrics

## Midpoint Calculation Logic

The core of the application is its sophisticated midpoint calculation system. Unlike simple geographic midpoints, Between Friends uses travel times and routes to find optimal meeting locations.

### Key Algorithms

#### 1. Transit Stop Extraction

For public transit routes, the application:
- Extracts all transit stops from the route
- Uses these as potential meeting points
- Adds "virtual stops" for better coverage

#### 2. Mixed Mode Calculations

When different transportation modes are used:
- Transit vs. Driving: Uses an adaptive bias correction
- Transit vs. Transit: Identifies common transit corridors
- Walking vs. Driving: Adjusts for the speed disparity

#### 3. Time Balancing

The application employs an adaptive bias correction system that:
- Detects travel time imbalances between different modes
- Applies a 10-30% bias correction factor based on the imbalance severity
- Ensures fairness for all participants

```typescript
// Example of adaptive bias correction
const bias = calculateBias(transitTime, drivingTime);
const adjustedMidpoint = applyBiasCorrection(candidates, bias);
```

## User Interface Components

### Core Components

- **MapView**: The central map display component
- **LocationInput**: Address search and input component
- **PlacesPanel**: Displays and filters potential meeting places
- **TransportModeSelector**: Allows users to choose transportation modes
- **PlaceTypeSelector**: Filters place types (restaurants, cafes, etc.)
- **RouteInfo**: Displays route information and travel times
- **AnimatedMarker**: Animated map markers for locations

### State Management

The application uses React Context for state management:

- **MapContext**: Provides map state and functions to all components
- **OptimizedMapContext**: Enhanced context with optimized API calls

## Testing

### API Call Testing

The application includes tools to test API call optimization:

```typescript
// Example of API call testing
await testApiCalls('Testing cache functionality', async () => {
  await cachedDirectionsService.route(request);
  // Make the same request again to test cache
  await cachedDirectionsService.route(request);
});

// Validate the results
validateApiCallStats(getApiCallStats(), {
  totalDirectionsRequests: 2,
  cachedDirectionsHits: 1,
  actualDirectionsApiCalls: 1
});
```

## Project Structure

```
├── app/                      # Next.js app router pages
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout with Google Maps provider
│   └── test-api-calls/       # API testing page
├── components/               # React components
│   ├── MapView.tsx           # Main map component
│   ├── LocationInput.tsx     # Location input and search
│   └── ...                   # Other UI components
├── contexts/                 # React contexts
│   └── MapContext.tsx        # Map state and functions
├── utils/                    # Utility functions
│   ├── apiCache.ts           # API caching system
│   ├── mapCalculations.ts    # Map calculation functions
│   ├── batchRoutes.ts        # Request batching utilities
│   └── googleMapsContext.tsx # Google Maps provider
├── public/                   # Static assets
└── README.md                 # This documentation
```

## Performance Optimization

Beyond API call optimization, the application employs:

1. **Component Memoization**: Prevents unnecessary re-renders
2. **Lazy Loading**: Defers loading of components until needed
3. **Throttling**: Limits frequent updates to improve performance
4. **Efficient DOM Updates**: Uses React's virtual DOM efficiently

## Future Enhancements

Planned features for future releases:

- **User Accounts**: Save favorite meeting spots and preferences
- **Real-time Collaboration**: Share and edit meeting plans with others
- **Time Scheduling**: Integrate with calendaring systems
- **More Transportation Options**: Add support for cycling and rideshare
- **Weather Integration**: Consider weather conditions in recommendations
- **Accessibility Enhancements**: Improve screen reader support

## Contributing

We welcome contributions to Between Friends! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Submit a pull request

For major changes, please open an issue first to discuss your ideas.

## License

This project is licensed under the MIT License - see the LICENSE file for details.