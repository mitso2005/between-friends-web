import React from 'react';
import { TransportMode } from './TransportModeSelector';

interface RouteInfoProps {
  directionsA: google.maps.DirectionsResult;
  directionsB: google.maps.DirectionsResult;
  transportModeA: TransportMode;
  transportModeB: TransportMode;
}

export const RouteInfo: React.FC<RouteInfoProps> = ({
  directionsA,
  directionsB,
  transportModeA,
  transportModeB,
}) => {
  // Get travel times in seconds
  const timeA = directionsA.routes[0].legs[0].duration?.value || 0;
  const timeB = directionsB.routes[0].legs[0].duration?.value || 0;
  
  // Calculate time difference in seconds and minutes
  const timeDiffSeconds = Math.abs(timeA - timeB);
  const timeDiffMinutes = Math.round(timeDiffSeconds / 60);
  
  // Calculate percentage difference
  const maxTime = Math.max(timeA, timeB);
  const percentageDiff = Math.round((timeDiffSeconds / maxTime) * 100);
  
  // Check if times are close enough (within 5 minutes or 10%)
  const isTimeFair = timeDiffSeconds <= 300 || percentageDiff <= 10;
  
  // Determine which route is longer
  const longerRoute = timeA > timeB ? 'A' : timeA < timeB ? 'B' : 'Equal';
  
  // Get text representation
  const timeAText = directionsA.routes[0].legs[0].duration?.text || "Unknown";
  const timeBText = directionsB.routes[0].legs[0].duration?.text || "Unknown";
  
  // Get Tailwind classes based on fairness
  const containerClasses = isTimeFair 
    ? "bg-green-50 border border-green-200" // Green for fair
    : "bg-accent-light border border-accent"; // Orange for unfair
  
  return (
    <div className={`mt-3 p-4 rounded-lg ${containerClasses}`}>
      {/* Transportation icons */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          {transportModeA === 'DRIVING' && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          )}
          {transportModeA === 'WALKING' && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          )}

          {transportModeA === 'TRANSIT' && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          )}
          <span className="text-sm font-medium">Location A</span>
        </div>
        <div className="flex items-center">
          {transportModeB === 'DRIVING' && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          )}
          {transportModeB === 'WALKING' && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          )}

          {transportModeB === 'TRANSIT' && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          )}
          <span className="text-sm font-medium">Location B</span>
        </div>
      </div>

      {/* Travel time info with improved styling */}
      <div className="flex justify-between items-center mb-3 bg-white rounded-lg p-3 shadow-sm">
        <div className={`${longerRoute === 'A' ? 'font-semibold' : 'font-normal'}`}>
          <div className="text-sm">From A</div>
          <div className="text-lg">{timeAText}</div>
        </div>
        <div className="text-xs px-2 py-1 bg-zinc-100 rounded-full">
          {timeDiffMinutes === 0 ? "Equal" : `${timeDiffMinutes} min diff`}
        </div>
        <div className={`${longerRoute === 'B' ? 'font-semibold' : 'font-normal'}`}>
          <div className="text-sm">From B</div>
          <div className="text-lg">{timeBText}</div>
        </div>
      </div>
      
      {/* Fairness indicator */}
      {!isTimeFair && (
        <div className="text-sm mt-2 p-3 bg-accent-light border border-accent rounded-md">
          <div className="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <strong>Note:</strong>
          </div>
          <div>Travel times differ by {timeDiffMinutes} minutes. 
          {transportModeA !== transportModeB && (
            <span> This may be the best possible compromise given the different transport modes.</span>
          )}
          {transportModeA === transportModeB && (
            <span> Try a different meeting location for more equal travel times.</span>
          )}</div>
        </div>
      )}
      
      {isTimeFair && (
        <div className="text-sm mt-2 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Travel times are fair and balanced
        </div>
      )}
    </div>
  );
};
