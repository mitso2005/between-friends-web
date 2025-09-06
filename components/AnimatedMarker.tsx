import React, { useEffect, useState } from 'react';
import { Marker } from '@react-google-maps/api';

interface AnimatedMarkerProps {
  position: google.maps.LatLngLiteral;
  title: string;
  onClick: () => void;
  isHovered: boolean;
  id: string;
  onMouseOver: () => void;
  onMouseOut: () => void;
}

export const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({
  position,
  title,
  onClick,
  isHovered,
  id,
  onMouseOver,
  onMouseOut
}) => {
  // Track animation state for pulsing effect
  const [isPulsing, setPulsing] = useState(false);
  const [scale, setScale] = useState(8);
  const [opacity, setOpacity] = useState(0.8);
  
  useEffect(() => {
    // If marker becomes hovered, animate the marker properties
    if (isHovered) {
      setPulsing(true);
      setScale(10);
      setOpacity(1);
    } else {
      // Animate back to original state
      setPulsing(false);
      setScale(8);
      setOpacity(0.8);
    }
  }, [isHovered]);
  
  // Alternate animation approach with smooth transitions
  useEffect(() => {
    let frameId: number;
    let currentScale = scale;
    let currentOpacity = opacity;
    
    // Animate scale and opacity when pulsing
    if (isPulsing) {
      let direction = 1;
      const animate = () => {
        if (direction > 0) {
          currentScale += 0.1;
          currentOpacity -= 0.01;
          if (currentScale >= 11) direction = -1;
        } else {
          currentScale -= 0.1;
          currentOpacity += 0.01;
          if (currentScale <= 9) direction = 1;
        }
        
        setScale(currentScale);
        setOpacity(Math.max(0.7, Math.min(1, currentOpacity)));
        
        frameId = requestAnimationFrame(animate);
      };
      
      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }
  }, [isPulsing]);
  
  return (
    <Marker
      position={position}
      title={title}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      cursor="pointer"
      animation={isHovered ? google.maps.Animation.BOUNCE : undefined}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: scale,
        fillColor: "#ea580c", // Tailwind orange-600
        fillOpacity: opacity,
        strokeColor: "#FFFFFF",
        strokeWeight: isHovered ? 3 : 2,
      }}
    />
  );
};
