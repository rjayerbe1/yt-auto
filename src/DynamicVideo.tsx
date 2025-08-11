import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Audio,
  staticFile,
} from 'remotion';

interface Scene {
  type: 'text' | 'image' | 'video';
  content: string;
  duration: number;
  style?: any;
}

interface DynamicVideoProps {
  title: string;
  hook: string;
  content: string;
  scenes?: Scene[];
  audioUrl?: string;
}

export const DynamicVideo: React.FC<DynamicVideoProps> = ({
  title,
  hook,
  content,
  scenes = [],
  audioUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Colores vibrantes para YouTube Shorts
  const colors = [
    '#FF006E', // Rosa vibrante
    '#FB5607', // Naranja
    '#FFBE0B', // Amarillo
    '#8338EC', // Púrpura
    '#3A86FF', // Azul
  ];

  // Animación de gradiente
  const gradientAngle = interpolate(
    frame,
    [0, durationInFrames],
    [0, 360]
  );

  const colorIndex = Math.floor(
    interpolate(frame, [0, durationInFrames], [0, colors.length])
  );

  const bgColor1 = colors[colorIndex % colors.length];
  const bgColor2 = colors[(colorIndex + 1) % colors.length];

  // Si hay escenas definidas, usarlas
  if (scenes.length > 0) {
    let currentFrame = 0;
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradientAngle}deg, ${bgColor1}, ${bgColor2})`,
        }}
      >
        {audioUrl && <Audio src={audioUrl} />}
        
        {scenes.map((scene, index) => {
          const sceneStart = currentFrame;
          const sceneDuration = scene.duration * fps;
          currentFrame += sceneDuration;

          return (
            <Sequence
              key={index}
              from={sceneStart}
              durationInFrames={sceneDuration}
            >
              <SceneRenderer scene={scene} frame={frame - sceneStart} fps={fps} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    );
  }

  // Diseño por defecto si no hay escenas
  const titleScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });

  const hookOpacity = interpolate(
    frame,
    [20, 40],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const contentOpacity = interpolate(
    frame,
    [60, 80],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${bgColor1}, ${bgColor2})`,
      }}
    >
      {audioUrl && <Audio src={audioUrl} />}

      {/* Título con animación */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          top: -300,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            transform: `scale(${titleScale})`,
            textShadow: '0 0 30px rgba(0,0,0,0.8)',
            padding: '0 40px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {title}
        </div>
      </AbsoluteFill>

      {/* Hook */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 60,
            color: '#FFE66D',
            textAlign: 'center',
            opacity: hookOpacity,
            padding: '0 40px',
            fontWeight: 600,
            textShadow: '0 0 20px rgba(0,0,0,0.6)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {hook}
        </div>
      </AbsoluteFill>

      {/* Contenido */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          top: 300,
        }}
      >
        <div
          style={{
            fontSize: 40,
            color: 'white',
            textAlign: 'center',
            opacity: contentOpacity,
            padding: '0 60px',
            lineHeight: 1.4,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {content}
        </div>
      </AbsoluteFill>

      {/* CTA */}
      <Sequence from={90} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 150,
          }}
        >
          <div
            style={{
              fontSize: 50,
              color: 'white',
              background: '#FF006E',
              padding: '20px 50px',
              borderRadius: 50,
              fontWeight: 'bold',
              opacity: interpolate(frame - 90, [0, 20], [0, 1]),
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
          >
            FOLLOW ME!
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// Componente para renderizar escenas individuales
const SceneRenderer: React.FC<{ scene: Scene; frame: number; fps: number }> = ({
  scene,
  frame,
  fps,
}) => {
  const opacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 10,
  });

  if (scene.type === 'text') {
    return (
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          ...scene.style,
        }}
      >
        <div
          style={{
            fontSize: 70,
            color: 'white',
            textAlign: 'center',
            padding: '0 40px',
            fontWeight: 'bold',
            opacity,
            textShadow: '0 0 30px rgba(0,0,0,0.8)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            ...scene.style,
          }}
        >
          {scene.content}
        </div>
      </AbsoluteFill>
    );
  }

  // Placeholder para otros tipos de escenas
  return null;
};