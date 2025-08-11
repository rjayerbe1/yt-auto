import React from 'react';
import { Composition } from '@remotion/core';
import { YouTubeShort } from './compositions/YouTubeShort';
import { TrendingTemplate } from './templates/TrendingTemplate';
import { FactsTemplate } from './templates/FactsTemplate';
import { StoryTimeTemplate } from './templates/StoryTimeTemplate';
import { LifeHacksTemplate } from './templates/LifeHacksTemplate';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="YouTubeShort"
        component={YouTubeShort}
        durationInFrames={30 * 60} // 60 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          script: {
            title: "Default Title",
            hook: "This is the hook",
            segments: [],
            callToAction: "Follow for more!",
          },
          template: "trending",
          audioUrl: null,
          backgroundMusic: "energetic",
        }}
      />
      
      <Composition
        id="TrendingTemplate"
        component={TrendingTemplate}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
      />
      
      <Composition
        id="FactsTemplate"
        component={FactsTemplate}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
      />
      
      <Composition
        id="StoryTimeTemplate"
        component={StoryTimeTemplate}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
      />
      
      <Composition
        id="LifeHacksTemplate"
        component={LifeHacksTemplate}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};