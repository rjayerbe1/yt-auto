import React from 'react';
import { registerRoot, Composition } from '@remotion/cli';

const MyComposition: React.FC = () => {
  return (
    <div style={{
      flex: 1,
      background: 'linear-gradient(to bottom, #0f0f0f, #1a1a1a)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 100,
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      YouTube Shorts Demo
    </div>
  );
};

export const RemotionRoot: React.FC = () => {
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