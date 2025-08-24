import React from 'react';

export type PlaceType = 'cafe' | 'restaurant' | 'bar';

interface PlaceTypeSelectorProps {
  selectedType: PlaceType;
  onTypeChange: (type: PlaceType) => void;
}

export const PlaceTypeSelector: React.FC<PlaceTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600 mb-1 block">
        What would you like to find?
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onTypeChange('cafe')}
          className={`flex-1 py-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700
            ${selectedType === 'cafe' ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={selectedType === 'cafe'}
        >
          ☕ Cafe
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('restaurant')}
          className={`flex-1 py-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700
            ${selectedType === 'restaurant' ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={selectedType === 'restaurant'}
        >
          🍽️ Restaurant
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('bar')}
          className={`flex-1 py-1.5 border border-gray-300 rounded text-xs cursor-pointer flex items-center justify-center text-gray-700
            ${selectedType === 'bar' ? "bg-gray-200 font-semibold" : "bg-transparent font-normal"}`}
          aria-pressed={selectedType === 'bar'}
        >
          🍸 Bar
        </button>
      </div>
    </div>
  );
};
