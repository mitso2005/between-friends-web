import React, { useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutocompleteLoad: (autocomplete: google.maps.places.Autocomplete) => void;
  onPlaceChanged: () => void;
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
  
  return (
    <div>
      <label className="text-sm text-gray-600 font-medium mb-1 block">
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
          className="p-2 text-base rounded border border-gray-500 w-full box-border"
          id={id}
        />
      </Autocomplete>
    </div>
  );
};
