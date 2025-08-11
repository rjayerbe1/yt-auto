import React from 'react';
import { registerRoot } from '@remotion/cli';
import { Composition, useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill, spring } from 'remotion';

// Composición principal del video
const YouTubeShortDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  
  // Animación de entrada
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 20,
  });
  
  // Rotación del fondo
  const rotation = interpolate(frame, [0, 150], [0, 360]);
  
  // Cambio de color
  const hue = interpolate(frame, [0, 150], [0, 360]);
  
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${rotation}deg, hsl(${hue}, 70%, 50%), hsl(${hue + 60}, 70%, 50%))`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    }}>
      {/* Título principal */}
      <div style={{
        fontSize: 80,
        fontWeight: 'bold',
        color: 'white',
        textShadow: '0 0 30px rgba(0,0,0,0.5)',
        transform: `scale(${scale})`,
        textAlign: 'center',
        padding: 20,
      }}>
        🎬 YouTube Shorts
      </div>
      
      {/* Subtítulo animado */}
      {frame > 30 && (
        <div style={{
          fontSize: 40,
          color: 'white',
          opacity: interpolate(frame, [30, 50], [0, 1]),
          marginTop: 20,
        }}>
        Automatización Viral
        </div>
      )}
      
      {/* Elementos flotantes */}
      <FloatingEmojis frame={frame} />
      
      {/* Call to action */}
      {frame > 90 && (
        <div style={{
          position: 'absolute',
          bottom: 100,
          fontSize: 30,
          color: 'white',
          background: 'rgba(255,0,0,0.8)',
          padding: '10px 30px',
          borderRadius: 50,
          opacity: interpolate(frame, [90, 110], [0, 1]),
        }}>
          ¡Sígueme para más!
        </div>
      )}
    </AbsoluteFill>
  );
};

// Emojis flotantes animados
const FloatingEmojis: React.FC<{ frame: number }> = ({ frame }) => {
  const emojis = ['🚀', '💡', '🔥', '⭐', '✨'];
  
  return (
    <>
      {emojis.map((emoji, i) => {
        const delay = i * 10;
        const y = interpolate(
          frame - delay,
          [0, 100],
          [500, -100],
          { extrapolateRight: 'clamp' }
        );
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              fontSize: 50,
              left: `${20 + i * 15}%`,
              top: y,
              opacity: frame > delay ? 1 : 0,
            }}
          >
            {emoji}
          </div>
        );
      })}
    </>
  );
};

// Root con las composiciones
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="YouTubeShort"
        component={YouTubeShortDemo}
        durationInFrames={150} // 5 segundos a 30fps
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

registerRoot(RemotionRoot);