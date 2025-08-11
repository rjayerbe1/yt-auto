import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  Img,
  useVideoConfig,
} from '@remotion/core';
import { loadFont } from '@remotion/google-fonts/Poppins';

const { fontFamily } = loadFont();

interface TrendingTemplateProps {
  script: any;
  currentFrame: number;
}

export const TrendingTemplate: React.FC<TrendingTemplateProps> = ({
  script,
  currentFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animated gradient background
  const gradientRotation = interpolate(
    frame,
    [0, fps * 60],
    [0, 360],
    { extrapolateRight: 'clamp' }
  );

  // Pulsing effect for emphasis
  const pulse = Math.sin(frame * 0.1) * 0.05 + 1;

  return (
    <AbsoluteFill>
      {/* Animated Gradient Background */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(${gradientRotation}deg, 
            #667eea 0%, 
            #764ba2 25%, 
            #f093fb 50%, 
            #fda085 75%, 
            #667eea 100%)`,
          opacity: 0.9,
        }}
      />

      {/* Particle Effects */}
      <ParticleBackground frame={frame} />

      {/* Content Container */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}
      >
        {/* Trending Badge */}
        <TrendingBadge frame={frame} />

        {/* Main Content Area */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 30,
            padding: 40,
            maxWidth: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            transform: `scale(${pulse})`,
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontFamily,
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            {script.title}
          </h1>
        </div>

        {/* Stats Display */}
        <StatsDisplay frame={frame} />
      </AbsoluteFill>

      {/* Fire Emoji Animation */}
      <FireEmojis frame={frame} />
    </AbsoluteFill>
  );
};

const TrendingBadge: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const rotation = interpolate(
    frame % (fps * 2),
    [0, fps * 2],
    [0, 360]
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        right: 50,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(45deg, #FF006E, #FFD23F)',
          padding: '15px 30px',
          borderRadius: 50,
          fontSize: 32,
          fontWeight: 'bold',
          color: 'white',
          boxShadow: '0 10px 30px rgba(255, 0, 110, 0.5)',
        }}
      >
        🔥 TRENDING
      </div>
    </div>
  );
};

const ParticleBackground: React.FC<{ frame: number }> = ({ frame }) => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 1080,
    y: Math.random() * 1920,
    size: Math.random() * 20 + 10,
    speed: Math.random() * 2 + 1,
  }));

  return (
    <>
      {particles.map((particle) => {
        const y = (particle.y - frame * particle.speed) % 1920;
        const opacity = Math.sin(frame * 0.05 + particle.id) * 0.5 + 0.5;

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
              background: 'rgba(255, 255, 255, 0.8)',
              opacity,
            }}
          />
        );
      })}
    </>
  );
};

const StatsDisplay: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  
  const slideIn = interpolate(
    frame,
    [fps * 0.5, fps * 1],
    [-200, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const stats = [
    { label: 'Views', value: '1.2M', icon: '👁️' },
    { label: 'Likes', value: '89K', icon: '❤️' },
    { label: 'Shares', value: '12K', icon: '📤' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 200,
        left: '50%',
        transform: `translateX(-50%) translateY(${-slideIn}px)`,
        display: 'flex',
        gap: 30,
      }}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '15px 25px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 28 }}>{stat.icon}</span>
          <div>
            <div style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
              {stat.value}
            </div>
            <div style={{ color: '#aaa', fontSize: 14 }}>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FireEmojis: React.FC<{ frame: number }> = ({ frame }) => {
  const emojis = ['🔥', '💯', '🚀', '⚡', '✨'];
  
  return (
    <>
      {emojis.map((emoji, index) => {
        const angle = (360 / emojis.length) * index;
        const radius = 300;
        const rotation = frame * 2;
        
        const x = Math.cos((angle + rotation) * Math.PI / 180) * radius;
        const y = Math.sin((angle + rotation) * Math.PI / 180) * radius;
        
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y}px)`,
              fontSize: 48,
            }}
          >
            {emoji}
          </div>
        );
      })}
    </>
  );
};