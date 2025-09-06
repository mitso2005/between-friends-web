import { useState, useCallback } from 'react';

// This hook tracks the hover state of a specific item by ID
export function useHoverState(initialState = {}) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  const onMouseOver = useCallback((id: string) => {
    setHoveredItemId(id);
  }, []);
  
  const onMouseOut = useCallback(() => {
    setHoveredItemId(null);
  }, []);
  
  const isHovered = useCallback((id: string) => {
    return hoveredItemId === id;
  }, [hoveredItemId]);
  
  return {
    hoveredItemId,
    onMouseOver,
    onMouseOut,
    isHovered,
  };
}
