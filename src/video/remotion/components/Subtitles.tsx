import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from '@remotion/core';

interface SubtitlesProps {
  audioUrl: string;
  script: any;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ audioUrl, script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find current subtitle segment
  const currentSegment = script.segments.find(
    (seg: any) => currentTime >= seg.startTime && currentTime < seg.endTime
  );

  if (!currentSegment || currentSegment.type !== 'narration') {
    return null;
  }

  // Calculate word-by-word animation
  const words = currentSegment.content.split(' ');
  const segmentDuration = currentSegment.endTime - currentSegment.startTime;
  const wordDuration = segmentDuration / words.length;
  const segmentProgress = (currentTime - currentSegment.startTime) / segmentDuration;
  const currentWordIndex = Math.floor(segmentProgress * words.length);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 150,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 40px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          maxWidth: '90%',
        }}
      >
        {words.map((word, index) => (
          <WordAnimation
            key={`${currentSegment.startTime}-${index}`}
            word={word}
            isActive={index <= currentWordIndex}
            delay={index * 2}
          />
        ))}
      </div>
    </div>
  );
};

interface WordAnimationProps {
  word: string;
  isActive: boolean;
  delay: number;
}

const WordAnimation: React.FC<WordAnimationProps> = ({ word, isActive, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    from: 0.5,
    to: 1,
    durationInFrames: 10,
  });

  const opacity = isActive ? 1 : 0.3;

  // Special styling for emphasis words
  const isEmphasis = /[A-Z]{2,}/.test(word) || /\d+/.test(word);
  const color = isEmphasis ? '#FFD700' : '#FFFFFF';
  const fontSize = isEmphasis ? 56 : 48;

  return (
    <span
      style={{
        fontSize,
        fontWeight: 'bold',
        color,
        textShadow: `
          -2px -2px 0 #000,
          2px -2px 0 #000,
          -2px 2px 0 #000,
          2px 2px 0 #000,
          0 0 10px rgba(0, 0, 0, 0.8)
        `,
        transform: `scale(${isActive ? scale : 0.8})`,
        opacity,
        transition: 'all 0.2s ease',
        display: 'inline-block',
        textTransform: 'uppercase',
      }}
    >
      {word}
    </span>
  );
};