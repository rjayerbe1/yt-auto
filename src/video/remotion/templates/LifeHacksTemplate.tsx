import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from '@remotion/core';

interface LifeHacksTemplateProps {
  script: any;
  currentFrame: number;
}

export const LifeHacksTemplate: React.FC<LifeHacksTemplateProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Bright gradient background */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)',
        }}
      />

      {/* Animated patterns */}
      <AnimatedIcons frame={frame} />

      {/* Main content */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}
      >
        {/* Life Hack Badge */}
        <HackBadge frame={frame} />

        {/* Main Hack Card */}
        <HackCard script={script} frame={frame} />

        {/* Step indicators */}
        <StepIndicators frame={frame} />
      </AbsoluteFill>

      {/* Timer/Counter */}
      <TimeDisplay frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const HackBadge: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  
  const bounce = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
  });

  const pulse = Math.sin(frame * 0.1) * 0.1 + 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: '50%',
        transform: `translateX(-50%) scale(${bounce * pulse})`,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(45deg, #FF6B6B, #FFE66D)',
          padding: '20px 40px',
          borderRadius: 50,
          fontSize: 36,
          fontWeight: 'bold',
          color: 'white',
          boxShadow: '0 15px 35px rgba(255, 107, 107, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 15,
        }}
      >
        💡 LIFE HACK
      </div>
    </div>
  );
};

const HackCard: React.FC<{ script: any; frame: number }> = ({ script, frame }) => {
  const { fps } = useVideoConfig();
  
  const slideIn = interpolate(
    frame,
    [fps * 0.5, fps * 1],
    [1920, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 40,
        padding: 50,
        maxWidth: '85%',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.15)',
        transform: `translateY(${slideIn}px)`,
        border: '5px solid #00C9FF',
      }}
    >
      {/* Hack Number */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: 40,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #FF6B6B, #FFE66D)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          fontWeight: 'bold',
          color: 'white',
        }}
      >
        #1
      </div>

      <h1
        style={{
          fontSize: 56,
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          marginBottom: 30,
          lineHeight: 1.2,
        }}
      >
        {script.title}
      </h1>

      {/* Benefit tags */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 15,
          flexWrap: 'wrap',
        }}
      >
        <BenefitTag text="Saves Time" icon="⏱️" />
        <BenefitTag text="Easy" icon="✨" />
        <BenefitTag text="Money Saver" icon="💰" />
      </div>
    </div>
  );
};

const BenefitTag: React.FC<{ text: string; icon: string }> = ({ text, icon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      background: 'linear-gradient(45deg, #00C9FF, #92FE9D)',
      borderRadius: 25,
      color: 'white',
      fontWeight: 'bold',
      fontSize: 20,
    }}
  >
    <span style={{ fontSize: 24 }}>{icon}</span>
    {text}
  </div>
);

const StepIndicators: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const steps = ['Prepare', 'Execute', 'Enjoy'];
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 200,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 30,
      }}
    >
      {steps.map((step, index) => {
        const stepFrame = fps * (index + 1) * 0.5;
        const isActive = frame >= stepFrame;
        const scale = spring({
          frame: frame - stepFrame,
          fps,
          from: 0,
          to: 1,
          durationInFrames: 20,
        });

        return (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${isActive ? scale : 0.8})`,
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: isActive
                  ? 'linear-gradient(45deg, #FF6B6B, #FFE66D)'
                  : '#ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {index + 1}
            </div>
            <span
              style={{
                marginTop: 10,
                fontSize: 18,
                fontWeight: 'bold',
                color: isActive ? '#333' : '#999',
              }}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const AnimatedIcons: React.FC<{ frame: number }> = ({ frame }) => {
  const icons = ['🔧', '🎯', '🚀', '⚡', '🎨', '📝', '🏆', '💪'];
  
  return (
    <>
      {icons.map((icon, index) => {
        const x = (index % 4) * 270 + 135;
        const y = Math.floor(index / 4) * 960 + 480;
        const rotation = frame * (index % 2 === 0 ? 1 : -1);
        const scale = Math.sin(frame * 0.05 + index) * 0.2 + 0.8;

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              fontSize: 80,
              opacity: 0.15,
              transform: `rotate(${rotation}deg) scale(${scale})`,
            }}
          >
            {icon}
          </div>
        );
      })}
    </>
  );
};

const TimeDisplay: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const seconds = Math.floor(frame / fps);
  const displayTime = `00:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        right: 50,
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 10,
        color: '#00FF00',
        fontSize: 28,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      }}
    >
      {displayTime}
    </div>
  );
};