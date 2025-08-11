import React from 'react';
import { Composition } from 'remotion';
import { MyVideo } from './MyVideo';
import { DynamicVideo } from './DynamicVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'YouTube Shorts Demo',
        }}
      />
      <Composition
        id="DynamicVideo"
        component={DynamicVideo}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'YouTube Short',
          hook: 'Amazing content!',
          content: 'This is great content',
          scenes: [],
        }}
      />
    </>
  );
};