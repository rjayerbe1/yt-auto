import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
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

// Animated particles background
const ParticlesBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 100 + 50,
    delay: Math.random() * 30,
  }));

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {particles.map((particle) => {
        const progress = ((frame + particle.delay) % particle.duration) / particle.duration;
        const y = interpolate(progress, [0, 1], [100, -10]);
        const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
        const scale = interpolate(progress, [0, 0.5, 1], [0.5, 1, 0.5]);

        return (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${y}%`,
              width: particle.size * 10,
              height: particle.size * 10,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,255,255,${opacity}) 0%, transparent 70%)`,
              transform: `scale(${scale})`,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Wave animation component
const WaveAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  
  const waveOffset = interpolate(frame, [0, 60], [0, width], {
    extrapolateRight: 'wrap',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        overflow: 'hidden',
        opacity: 0.3,
      }}
    >
      <svg
        width="200%"
        height="100%"
        style={{
          transform: `translateX(-${waveOffset}px)`,
        }}
      >
        <path
          d={`M0,100 Q${width/4},50 ${width/2},100 T${width},100 T${width*1.5},100 T${width*2},100 L${width*2},200 L0,200 Z`}
          fill="url(#waveGradient)"
        />
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#45B7D1" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Animated subtitle with character-by-character reveal
const AnimatedSubtitle: React.FC<{
  text: string;
  startFrame: number;
  durationFrames: number;
}> = ({ text, startFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;
  
  // Bounce in animation
  const scale = spring({
    frame: relativeFrame,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 10,
      stiffness: 100,
      mass: 0.5,
    },
  });
  
  // Glow effect intensity
  const glowIntensity = interpolate(
    relativeFrame,
    [0, 10, durationFrames - 10, durationFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  // Character reveal animation
  const chars = text.split('');
  const charDelay = Math.min(3, durationFrames / chars.length);
  
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        transform: `scale(${scale})`,
      }}
    >
      {/* Glow background */}
      <div
        style={{
          position: 'absolute',
          width: '80%',
          height: 200,
          background: `radial-gradient(ellipse at center, rgba(255,215,0,${glowIntensity * 0.3}) 0%, transparent 70%)`,
          filter: 'blur(40px)',
          transform: 'scale(1.5)',
        }}
      />
      
      {/* Text container with glass morphism */}
      <div
        style={{
          backgroundColor: `rgba(10, 10, 10, ${0.6 + glowIntensity * 0.2})`,
          padding: '25px 35px',
          borderRadius: 25,
          backdropFilter: 'blur(20px) saturate(180%)',
          border: `2px solid rgba(255, 255, 255, ${0.1 + glowIntensity * 0.2})`,
          boxShadow: `
            0 0 ${30 * glowIntensity}px rgba(255, 215, 0, 0.5),
            0 10px 40px rgba(0, 0, 0, 0.3),
            inset 0 0 20px rgba(255, 255, 255, 0.05)
          `,
          maxWidth: '90%',
          position: 'relative',
        }}
      >
        <p
          style={{
            fontSize: 52,
            fontFamily: 'Inter, Arial, sans-serif',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.4,
            margin: 0,
            letterSpacing: -1,
          }}
        >
          {chars.map((char, index) => {
            const charFrame = index * charDelay;
            const charOpacity = interpolate(
              relativeFrame,
              [charFrame, charFrame + 5],
              [0, 1],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }
            );
            
            const charY = interpolate(
              relativeFrame,
              [charFrame, charFrame + 10],
              [20, 0],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.back()),
              }
            );
            
            const isHighlighted = relativeFrame > charFrame + 5;
            
            return (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  opacity: charOpacity,
                  transform: `translateY(${charY}px)`,
                  color: isHighlighted ? '#FFD700' : '#FFFFFF',
                  textShadow: isHighlighted
                    ? `
                      0 0 20px rgba(255, 215, 0, 0.8),
                      0 0 40px rgba(255, 215, 0, 0.4),
                      2px 2px 4px rgba(0, 0, 0, 0.5)
                    `
                    : '2px 2px 4px rgba(0, 0, 0, 0.5)',
                  transition: 'color 0.3s ease',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Audio visualizer bars
const AudioVisualizer: React.FC<{ intensity: number }> = ({ intensity }) => {
  const frame = useCurrentFrame();
  const bars = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    height: Math.sin((frame + i * 10) * 0.1) * 50 + 50,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        opacity: intensity,
      }}
    >
      {bars.map((bar) => (
        <div
          key={bar.id}
          style={{
            width: 8,
            height: bar.height * intensity,
            background: 'linear-gradient(180deg, #FFD700, #FF6B6B)',
            borderRadius: 4,
            transition: 'height 0.1s ease',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}
        />
      ))}
    </div>
  );
};

// Pulsing ring animation
const PulsingRing: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.8, 1.2, 0.8],
    {
      easing: Easing.inOut(Easing.ease),
    }
  );
  const opacity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.1, 0.3],
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: 600,
        height: 600,
        borderRadius: '50%',
        border: '3px solid rgba(255, 215, 0, 0.5)',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

// Main animated synced video component
export const AnimatedSyncedVideo: React.FC<SyncedVideoProps> = ({
  title,
  segments,
  totalDuration,
  audioUrl,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Calculate current progress
  const progress = frame / durationInFrames;
  
  // Dynamic background color shift
  const hue = interpolate(frame, [0, durationInFrames], [0, 360]);
  
  // Current segment for audio visualizer
  const currentSegmentIndex = segments.findIndex(s => 
    frame >= s.startTime * fps && frame < s.endTime * fps
  );
  const audioIntensity = currentSegmentIndex >= 0 ? 1 : 0.3;
  
  return (
    <AbsoluteFill 
      style={{ 
        background: `linear-gradient(135deg, 
          hsl(${hue}, 70%, 10%) 0%, 
          hsl(${hue + 60}, 70%, 15%) 100%)`,
      }}
    >
      {/* Animated particles */}
      <ParticlesBackground />
      
      {/* Pulsing ring */}
      <PulsingRing />
      
      {/* Wave animation */}
      <WaveAnimation />
      
      {/* Title with dramatic entrance */}
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
              fontSize: 80,
              fontFamily: 'Inter, Arial, sans-serif',
              fontWeight: 900,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 3,
              background: `linear-gradient(135deg, 
                hsl(${hue}, 100%, 60%) 0%, 
                hsl(${hue + 60}, 100%, 70%) 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 20px rgba(255, 215, 0, 0.5))',
              animation: 'pulse 2s infinite',
            }}
          >
            {title}
          </h1>
        </AbsoluteFill>
      </Sequence>
      
      {/* Synchronized animated subtitles */}
      {segments.map((segment, index) => {
        const startFrame = Math.round(segment.startTime * fps);
        const durationFrames = Math.round(segment.duration * fps);
        
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <AnimatedSubtitle
              text={segment.text}
              startFrame={startFrame}
              durationFrames={durationFrames}
            />
          </Sequence>
        );
      })}
      
      {/* Audio track */}
      {audioUrl && (
        <Audio src={audioUrl} />
      )}
      
      {/* Audio visualizer */}
      <AudioVisualizer intensity={audioIntensity} />
      
      {/* Progress indicator with segments */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          background: 'rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #FF6B6B, #FFD700, #4ECDC4)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
            transition: 'width 0.1s linear',
          }}
        />
        
        {/* Segment markers */}
        {segments.map((segment, index) => {
          const position = (segment.startTime / totalDuration) * 100;
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${position}%`,
                top: 0,
                width: 2,
                height: '100%',
                background: 'rgba(255, 255, 255, 0.5)',
              }}
            />
          );
        })}
      </div>
      
      {/* Segment counter with animation */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          right: 30,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px 25px',
          borderRadius: 15,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <p
          style={{
            color: '#FFD700',
            fontSize: 24,
            margin: 0,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}
        >
          {currentSegmentIndex + 1} / {segments.length}
        </p>
      </div>
    </AbsoluteFill>
  );
};