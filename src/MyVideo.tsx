import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

export const MyVideo: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Animación de escala
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  // Rotación del fondo
  const rotation = interpolate(frame, [0, durationInFrames], [0, 360]);

  // Colores animados
  const hue = interpolate(frame, [0, durationInFrames], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${rotation}deg, hsl(${hue}, 70%, 50%), hsl(${hue + 120}, 70%, 50%))`,
      }}
    >
      {/* Título principal */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 100,
              color: 'white',
              textAlign: 'center',
              transform: `scale(${scale})`,
              textShadow: '0 0 30px rgba(0,0,0,0.5)',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {title}
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Subtítulo */}
      <Sequence from={30} durationInFrames={120}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            top: 200,
          }}
        >
          <div
            style={{
              fontSize: 50,
              color: 'yellow',
              opacity: interpolate(frame - 30, [0, 20], [0, 1]),
            }}
          >
            🎬 Viral Automation
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Call to Action */}
      <Sequence from={90} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 100,
          }}
        >
          <div
            style={{
              fontSize: 60,
              color: 'white',
              background: 'red',
              padding: '20px 40px',
              borderRadius: 50,
              opacity: interpolate(frame - 90, [0, 20], [0, 1]),
            }}
          >
            Follow Me!
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};