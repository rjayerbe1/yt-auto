import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { RemotionRoot } from '../Root';
import { SyncedVideo } from './SyncedVideo';
import { AnimatedSyncedVideo } from './AnimatedSyncedVideo';
import { WordByWordVideo } from './WordByWordVideoWithStyles';
import { WordByWordVideo as WordByWordVideoContext } from './WordByWordVideoContext';
import { WordByWordVideo as WordByWordAccumulator } from './WordByWordAccumulator';
import { WordByWordVideo as WordByWordAccumulator30 } from './WordByWordAccumulator30Styles';
import { WordByWordVideo as WordByWordFinal } from './WordByWordFinalStyles';
import { WordByWordVideo as WordByWordWithBroll } from './WordByWordWithBroll';
import { DebugSubtitles } from './DebugSubtitles';

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
      <Composition
        id="WordByWordVideoContext"
        component={WordByWordVideoContext}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Word by Word Video with Context',
          segments: [],
          totalDuration: 30,
        }}
      />
      <Composition
        id="WordByWordAccumulator"
        component={WordByWordAccumulator}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Word Accumulator (6 words cycle)',
          segments: [],
          totalDuration: 30,
        }}
      />
      <Composition
        id="WordByWordAccumulator30"
        component={WordByWordAccumulator30}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Word Accumulator 30 Styles',
          segments: [],
          totalDuration: 30,
        }}
      />
      <Composition
        id="WordByWordFinal"
        component={WordByWordFinal}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Word Final 6 Styles',
          segments: [],
          totalDuration: 30,
        }}
      />
      <Composition
        id="DebugSubtitles"
        component={DebugSubtitles}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Debug Subtitles',
          segments: [],
          totalDuration: 30,
        }}
      />
      <Composition
        id="WordByWordWithBroll"
        component={WordByWordWithBroll}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Word by Word with B-roll',
          segments: [],
          totalDuration: 30,
          brollVideos: [],
        }}
      />
    </>
  );
};

registerRoot(RemotionVideo);