import React, { useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceChanged: () => void;
  onAutocompleteLoad: (autocomplete: google.maps.places.Autocomplete) => void;
  id: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onPlaceChanged,
  onAutocompleteLoad,
  id,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      // Ensure the input is properly styled
      inputRef.current.style.color = '#000';
      inputRef.current.style.backgroundColor = '#fff';
    }
  }, []);

  return (
    <div>
      <label style={{ fontSize: "14px", color: "#666", fontWeight: "500", marginBottom: "4px", display: "block" }}>
        {label}
      </label>
      <Autocomplete
        onLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100%",
            color: "#000",
            backgroundColor: "#fff",
            boxSizing: "border-box",
          }}
          id={id}
        />
      </Autocomplete>
    </div>
  );
};
