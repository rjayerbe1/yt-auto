import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from '@remotion/core';
import { loadFont } from '@remotion/google-fonts/Roboto';

const { fontFamily } = loadFont();

interface FactsTemplateProps {
  script: any;
  currentFrame: number;
}

export const FactsTemplate: React.FC<FactsTemplateProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animated counter effect
  const factNumber = Math.floor(interpolate(frame, [0, fps * 2], [0, 100]));

  return (
    <AbsoluteFill>
      {/* Scientific Background Pattern */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          opacity: 0.9,
        }}
      />
      
      {/* Animated Grid */}
      <GridBackground frame={frame} />

      {/* Content Container */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}
      >
        {/* Fact Number Display */}
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 120,
            fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
          }}
        >
          #{factNumber}
        </div>

        {/* Main Fact Card */}
        <FactCard script={script} frame={frame} />

        {/* Scientific Icons */}
        <FloatingIcons frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FactCard: React.FC<{ script: any; frame: number }> = ({ script, frame }) => {
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 20,
  });

  const rotation = interpolate(
    frame % (fps * 4),
    [0, fps * 4],
    [0, 360]
  );

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 30,
        padding: 60,
        maxWidth: '85%',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
        transform: `scale(${scale}) rotate(${rotation * 0.01}deg)`,
        border: '5px solid #FFD700',
      }}
    >
      <div
        style={{
          fontSize: 36,
          color: '#764ba2',
          fontWeight: 'bold',
          marginBottom: 20,
          textTransform: 'uppercase',
        }}
      >
        Did You Know?
      </div>
      
      <h1
        style={{
          fontSize: 52,
          fontFamily,
          fontWeight: 'bold',
          color: '#1a1a1a',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {script.title}
      </h1>

      {/* Verification Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 30,
          gap: 10,
        }}
      >
        <VerificationBadge />
      </div>
    </div>
  );
};

const GridBackground: React.FC<{ frame: number }> = ({ frame }) => {
  const gridSize = 50;
  const rows = Math.ceil(1920 / gridSize);
  const cols = Math.ceil(1080 / gridSize);

  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.1,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const delay = (row + col) * 2;
        const opacity = Math.sin((frame - delay) * 0.1) * 0.5 + 0.5;

        return (
          <rect
            key={i}
            x={col * gridSize}
            y={row * gridSize}
            width={gridSize - 2}
            height={gridSize - 2}
            fill="white"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

const FloatingIcons: React.FC<{ frame: number }> = ({ frame }) => {
  const icons = ['🔬', '🧬', '🔭', '⚗️', '🧪', '📊', '🧠', '💡'];
  
  return (
    <>
      {icons.map((icon, index) => {
        const angle = (360 / icons.length) * index;
        const radius = 400;
        const rotation = frame * 0.5;
        
        const x = Math.cos((angle + rotation) * Math.PI / 180) * radius;
        const y = Math.sin((angle + rotation) * Math.PI / 180) * radius;
        
        const floatY = Math.sin(frame * 0.05 + index) * 20;
        
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y + floatY}px)`,
              fontSize: 64,
              opacity: 0.7,
            }}
          >
            {icon}
          </div>
        );
      })}
    </>
  );
};

const VerificationBadge: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      background: 'linear-gradient(45deg, #00C851, #00FF00)',
      borderRadius: 20,
      color: 'white',
      fontWeight: 'bold',
      fontSize: 18,
    }}
  >
    ✓ Fact Checked
  </div>
);