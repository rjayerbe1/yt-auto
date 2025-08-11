import React from 'react';
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  AbsoluteFill,
} from '@remotion/core';

interface TransitionEffectProps {
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'glitch' | 'swipe';
  duration?: number;
  children: React.ReactNode;
}

export const TransitionEffect: React.FC<TransitionEffectProps> = ({
  type,
  duration = 15, // frames
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const getTransform = () => {
    switch (type) {
      case 'fade':
        return { opacity: progress };
      
      case 'slide':
        return {
          transform: `translateY(${interpolate(progress, [0, 1], [100, 0])}%)`,
        };
      
      case 'zoom':
        return {
          transform: `scale(${interpolate(progress, [0, 1], [0.5, 1])})`,
        };
      
      case 'rotate':
        return {
          transform: `rotate(${interpolate(progress, [0, 1], [180, 0])}deg) scale(${progress})`,
        };
      
      case 'glitch':
        return {
          transform: `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`,
          filter: `hue-rotate(${Math.random() * 360}deg)`,
          opacity: progress > 0.5 ? 1 : Math.random(),
        };
      
      case 'swipe':
        return {
          clipPath: `polygon(0 0, ${progress * 100}% 0, ${progress * 100}% 100%, 0 100%)`,
        };
      
      default:
        return {};
    }
  };

  return (
    <AbsoluteFill style={getTransform()}>
      {children}
    </AbsoluteFill>
  );
};