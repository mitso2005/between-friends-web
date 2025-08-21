import React from 'react';

interface ErrorMessageProps {
  message: string;
  type: 'error' | 'warning';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, type }) => {
  const styles = type === 'error' 
    ? { 
        backgroundColor: "rgba(255, 0, 0, 0.1)", 
        border: "1px solid rgba(255, 0, 0, 0.2)",
        color: "#d32f2f"
      }
    : {
        backgroundColor: "#FFF3E0", 
        border: "1px solid #FFB74D",
        color: "#E65100"
      };
  
  return (
    <div style={{ 
      marginTop: "8px", 
      padding: "8px", 
      borderRadius: "4px",
      fontSize: "14px",
      ...styles
    }}>
      {message}
    </div>
  );
};

export const ApiKeyError: React.FC = () => {
  return (
    <div style={{ 
      marginTop: "12px", 
      padding: "10px", 
      backgroundColor: "#FFF3E0", 
      border: "1px solid #FFB74D",
      borderRadius: "4px",
      fontSize: "14px",
      color: "#E65100"
    }}>
      <div style={{ fontWeight: "600", marginBottom: "4px" }}>API Key Warning</div>
      <p>Your Google Maps API key is not authorized for the Directions Service. To enable route calculation:</p>
      <ol style={{ marginLeft: "20px", marginTop: "8px" }}>
        <li>Go to the Google Cloud Console</li>
        <li>Enable the "Directions API" for your project</li>
        <li>Make sure billing is set up for your Google Cloud account</li>
      </ol>
      <p style={{ marginTop: "8px" }}>Currently using geographic midpoint only.</p>
    </div>
  );
};
