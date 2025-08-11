import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface AudioSegment {
  text: string;
  audioFile: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface SyncedVideoProps {
  title: string;
  segments: AudioSegment[];
  totalDuration: number;
  audioUrl?: string;
}

// Subtitle component that appears in sync with audio
const SyncedSubtitle: React.FC<{
  text: string;
  startFrame: number;
  durationFrames: number;
}> = ({ text, startFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Animation for subtitle entrance
  const scale = spring({
    frame: frame - startFrame,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 10,
  });
  
  // Fade in/out
  const opacity = interpolate(
    frame - startFrame,
    [0, 5, durationFrames - 5, durationFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  // Word-by-word highlight animation
  const words = text.split(' ');
  const wordDuration = durationFrames / words.length;
  const currentWordIndex = Math.floor((frame - startFrame) / wordDuration);
  
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '20px 30px',
          borderRadius: 20,
          backdropFilter: 'blur(10px)',
          maxWidth: '90%',
        }}
      >
        <p
          style={{
            fontSize: 48,
            fontFamily: 'Inter, Arial, sans-serif',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {words.map((word, index) => (
            <span
              key={index}
              style={{
                color: index <= currentWordIndex ? '#FFD700' : 'white',
                transition: 'color 0.3s ease',
                textShadow: index <= currentWordIndex 
                  ? '0 0 20px rgba(255, 215, 0, 0.8)' 
                  : '2px 2px 4px rgba(0,0,0,0.5)',
                marginRight: 8,
              }}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Progress bar showing video timeline
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #FF6B6B, #FFD93D)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
};

// Main synced video component
export const SyncedVideo: React.FC<SyncedVideoProps> = ({
  title,
  segments,
  totalDuration,
  audioUrl,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Calculate current progress
  const progress = frame / durationInFrames;
  
  // Background animation
  const backgroundRotation = interpolate(
    frame,
    [0, durationInFrames],
    [0, 360]
  );
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#0F0F0F' }}>
      {/* Animated background */}
      <AbsoluteFill>
        <div
          style={{
            width: '200%',
            height: '200%',
            background: `conic-gradient(from ${backgroundRotation}deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD, #FF6B6B)`,
            opacity: 0.1,
            transform: 'translate(-25%, -25%)',
          }}
        />
      </AbsoluteFill>
      
      {/* Title */}
      <Sequence from={0} durationInFrames={fps * 2}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontFamily: 'Inter, Arial, sans-serif',
              fontWeight: 900,
              color: 'white',
              textAlign: 'center',
              textShadow: '3px 3px 6px rgba(0,0,0,0.7)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </h1>
        </AbsoluteFill>
      </Sequence>
      
      {/* Synchronized subtitles for each segment */}
      {segments.map((segment, index) => {
        const startFrame = Math.round(segment.startTime * fps);
        const durationFrames = Math.round(segment.duration * fps);
        
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <SyncedSubtitle
              text={segment.text}
              startFrame={startFrame}
              durationFrames={durationFrames}
            />
          </Sequence>
        );
      })}
      
      {/* Combined audio track */}
      {audioUrl && (
        <Audio src={audioUrl} />
      )}
      
      {/* Progress bar */}
      <ProgressBar progress={progress} />
      
      {/* Segment indicators */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px 20px',
          borderRadius: 10,
          backdropFilter: 'blur(10px)',
        }}
      >
        <p
          style={{
            color: 'white',
            fontSize: 18,
            margin: 0,
            fontFamily: 'monospace',
          }}
        >
          {segments.findIndex(s => 
            frame >= s.startTime * fps && frame < s.endTime * fps
          ) + 1} / {segments.length}
        </p>
      </div>
    </AbsoluteFill>
  );
};