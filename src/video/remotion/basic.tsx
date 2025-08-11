import React from 'react';
import { registerRoot } from '@remotion/cli';

// Componente simple sin dependencias problemáticas
const SimpleVideo: React.FC<{ text?: string }> = ({ text = "YouTube Shorts Demo" }) => {
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <h1
        style={{
          fontSize: 80,
          color: '#fff',
          textAlign: 'center',
          padding: 40,
        }}
      >
        {text}
      </h1>
      <div
        style={{
          fontSize: 40,
          color: '#ff0000',
          marginTop: 20,
        }}
      >
        🎬 Automatización Viral
      </div>
    </div>
  );
};

// Definir la composición
const MyComposition = () => {
  return <SimpleVideo />;
};

// Root component
export const RemotionRoot: React.FC = () => {
  const Composition = require('@remotion/cli').Composition;
  
  return (
    <>
      <Composition
        id="YouTubeShort"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

registerRoot(RemotionRoot);