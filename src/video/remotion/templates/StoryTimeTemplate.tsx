import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from '@remotion/core';

interface StoryTimeTemplateProps {
  script: any;
  currentFrame: number;
}

export const StoryTimeTemplate: React.FC<StoryTimeTemplateProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cinematic bars animation
  const barsHeight = interpolate(frame, [0, fps * 0.5], [0, 150], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Dark cinematic background */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1e 100%)',
        }}
      />

      {/* Floating particles for atmosphere */}
      <ParticleEffect frame={frame} />

      {/* Main content */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
        }}
      >
        {/* Story Title Card */}
        <StoryCard script={script} frame={frame} />

        {/* Dramatic lighting effect */}
        <SpotlightEffect frame={frame} />
      </AbsoluteFill>

      {/* Cinematic bars */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: barsHeight,
          background: 'black',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: barsHeight,
          background: 'black',
        }}
      />
    </AbsoluteFill>
  );
};

const StoryCard: React.FC<{ script: any; frame: number }> = ({ script, frame }) => {
  const { fps } = useVideoConfig();
  
  const fadeIn = interpolate(frame, [0, fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const typewriterLength = Math.floor(
    interpolate(frame, [fps * 0.5, fps * 2], [0, script.title.length], {
      extrapolateRight: 'clamp',
    })
  );

  const displayText = script.title.slice(0, typewriterLength);

  return (
    <div
      style={{
        opacity: fadeIn,
        textAlign: 'center',
      }}
    >
      {/* Story Time Label */}
      <div
        style={{
          fontSize: 36,
          color: '#FFD700',
          fontWeight: 'bold',
          marginBottom: 20,
          textTransform: 'uppercase',
          letterSpacing: 4,
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
        }}
      >
        Story Time
      </div>

      {/* Title with typewriter effect */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.2,
          textShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
          minHeight: 200,
        }}
      >
        {displayText}
        <span
          style={{
            opacity: Math.sin(frame * 0.2) > 0 ? 1 : 0,
            color: '#FFD700',
          }}
        >
          |
        </span>
      </h1>

      {/* Chapter indicator */}
      <ChapterIndicator frame={frame} />
    </div>
  );
};

const ParticleEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 1080,
    baseY: Math.random() * 1920,
    size: Math.random() * 4 + 2,
    speed: Math.random() * 0.5 + 0.5,
  }));

  return (
    <>
      {particles.map((particle) => {
        const y = (particle.baseY - frame * particle.speed) % 1920;
        const opacity = Math.sin(frame * 0.02 + particle.id) * 0.3 + 0.3;

        return (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: particle.x,
              top: y,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              background: '#FFD700',
              opacity,
              boxShadow: `0 0 ${particle.size * 2}px rgba(255, 215, 0, 0.5)`,
            }}
          />
        );
      })}
    </>
  );
};

const SpotlightEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const spotlightX = interpolate(
    Math.sin(frame * 0.02),
    [-1, 1],
    [200, 880]
  );

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at ${spotlightX}px 50%, 
          transparent 0%, 
          transparent 300px, 
          rgba(0, 0, 0, 0.4) 600px)`,
        pointerEvents: 'none',
      }}
    />
  );
};

const ChapterIndicator: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame: frame - fps,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  return (
    <div
      style={{
        marginTop: 40,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 20,
          padding: '10px 30px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 50,
          border: '2px solid #FFD700',
        }}
      >
        <span style={{ color: '#FFD700', fontSize: 24 }}>Chapter 1</span>
        <span style={{ color: '#FFFFFF', fontSize: 20 }}>The Beginning</span>
      </div>
    </div>
  );
};