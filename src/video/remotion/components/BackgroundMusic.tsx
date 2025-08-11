import React from 'react';
import { Audio, useCurrentFrame, interpolate } from '@remotion/core';
import path from 'path';

interface BackgroundMusicProps {
  type: 'energetic' | 'calm' | 'mysterious' | 'upbeat';
  volume?: number;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  type,
  volume = 0.3,
}) => {
  const frame = useCurrentFrame();
  
  // Fade in/out for smooth transitions
  const fadeInFrames = 30;
  const fadeOutFrames = 30;
  
  const audioVolume = interpolate(
    frame,
    [0, fadeInFrames, 1800 - fadeOutFrames, 1800], // 60 seconds at 30fps
    [0, volume, volume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const musicPaths = {
    energetic: '/assets/music/energetic.mp3',
    calm: '/assets/music/calm.mp3',
    mysterious: '/assets/music/mysterious.mp3',
    upbeat: '/assets/music/upbeat.mp3',
  };

  const musicPath = musicPaths[type];

  return <Audio src={musicPath} volume={audioVolume} loop />;
};