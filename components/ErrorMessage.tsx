import React from 'react';

interface ErrorMessageProps {
  message: string;
  type: 'error' | 'warning';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, type }) => {
  const className = type === 'error' 
    ? 'bg-red-50 border border-red-200 text-red-700' 
    : 'bg-orange-50 border border-orange-300 text-orange-800';
  
  return (
    <div className={`mt-2 p-2 rounded text-sm ${className}`}>
      {message}
    </div>
  );
};

export const ApiKeyError: React.FC = () => {
  return (
    <div className="mt-3 p-2.5 bg-orange-50 border border-orange-300 rounded text-sm text-orange-800">
      <div className="font-semibold mb-1">API Key Warning</div>
      <p>Your Google Maps API key is not authorized for the required API services. To enable all features:</p>
      <ol className="ml-5 mt-2">
        <li>Go to the Google Cloud Console</li>
        <li>Enable the "Directions API" and "Places API" for your project</li>
        <li>Make sure billing is set up for your Google Cloud account</li>
      </ol>
    </div>
  );
};

export const PlacesApiError: React.FC = () => {
  return (
    <div className="mt-3 p-2.5 bg-orange-50 border border-orange-300 rounded text-sm text-orange-800">
      <div className="font-semibold mb-1">Places API Warning</div>
      <p>Could not search for nearby places. To enable this feature:</p>
      <ol className="ml-5 mt-2">
        <li>Go to the Google Cloud Console</li>
        <li>Enable the "Places API" for your project</li>
        <li>Make sure billing is set up for your Google Cloud account</li>
      </ol>
    </div>
  );
};
