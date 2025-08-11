import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { RemotionRoot } from '../Root';
import { SyncedVideo } from './SyncedVideo';
import { AnimatedSyncedVideo } from './AnimatedSyncedVideo';
import { WordByWordVideo } from './WordByWordVideo';

// Register both compositions
export const RemotionVideo = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={RemotionRoot}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SyncedVideo"
        component={SyncedVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Synced Video',
          segments: [],
          totalDuration: 30,
        }}
      />
      <Composition
        id="AnimatedSyncedVideo"
        component={AnimatedSyncedVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Animated Video',
          segments: [],
          totalDuration: 30,
        }}
      />
      <Composition
        id="WordByWordVideo"
        component={WordByWordVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Word by Word Video',
          segments: [],
          totalDuration: 30,
        }}
      />
    </>
  );
};

registerRoot(RemotionVideo);