import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from '@remotion/core';
import { loadFont } from '@remotion/google-fonts/Montserrat';
import { TrendingTemplate } from '../templates/TrendingTemplate';
import { FactsTemplate } from '../templates/FactsTemplate';
import { StoryTimeTemplate } from '../templates/StoryTimeTemplate';
import { LifeHacksTemplate } from '../templates/LifeHacksTemplate';
import { Subtitles } from '../components/Subtitles';
import { BackgroundMusic } from '../components/BackgroundMusic';
import { TransitionEffect } from '../components/TransitionEffect';

const { fontFamily } = loadFont();

interface YouTubeShortProps {
  script: {
    title: string;
    hook: string;
    segments: Array<{
      type: string;
      content: string;
      startTime: number;
      endTime: number;
      visualDescription?: string;
    }>;
    callToAction: string;
  };
  template: 'trending' | 'facts' | 'storytime' | 'lifehacks';
  audioUrl: string | null;
  backgroundMusic: 'energetic' | 'calm' | 'mysterious' | 'upbeat';
  subtitlesEnabled?: boolean;
}

export const YouTubeShort: React.FC<YouTubeShortProps> = ({
  script,
  template,
  audioUrl,
  backgroundMusic,
  subtitlesEnabled = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Select template based on prop
  const TemplateComponent = {
    trending: TrendingTemplate,
    facts: FactsTemplate,
    storytime: StoryTimeTemplate,
    lifehacks: LifeHacksTemplate,
  }[template];

  // Calculate segment frames
  const segmentFrames = script.segments.map(segment => ({
    ...segment,
    startFrame: Math.floor(segment.startTime * fps),
    endFrame: Math.floor(segment.endTime * fps),
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Main Template */}
      <TemplateComponent
        script={script}
        currentFrame={frame}
      />

      {/* Segments with transitions */}
      {segmentFrames.map((segment, index) => (
        <Sequence
          key={index}
          from={segment.startFrame}
          durationInFrames={segment.endFrame - segment.startFrame}
        >
          <TransitionEffect type="fade">
            <SegmentRenderer segment={segment} />
          </TransitionEffect>
        </Sequence>
      ))}

      {/* Hook Sequence - First 3 seconds */}
      <Sequence from={0} durationInFrames={3 * fps}>
        <HookSection hook={script.hook} />
      </Sequence>

      {/* Call to Action - Last 3 seconds */}
      <Sequence from={durationInFrames - 3 * fps} durationInFrames={3 * fps}>
        <CTASection cta={script.callToAction} />
      </Sequence>

      {/* Subtitles */}
      {subtitlesEnabled && audioUrl && (
        <Subtitles
          audioUrl={audioUrl}
          script={script}
        />
      )}

      {/* Audio Elements */}
      {audioUrl && <Audio src={audioUrl} />}
      <BackgroundMusic type={backgroundMusic} volume={0.3} />
    </AbsoluteFill>
  );
};

const HookSection: React.FC<{ hook: string }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: 10,
  });

  const opacity = interpolate(
    frame,
    [0, 5, fps * 3 - 5, fps * 3],
    [0, 1, 1, 0]
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontFamily,
          fontWeight: 'bold',
          color: '#FFD700',
          textAlign: 'center',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
          transform: `scale(${scale})`,
          opacity,
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {hook}
      </div>
    </AbsoluteFill>
  );
};

const CTASection: React.FC<{ cta: string }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const slideUp = interpolate(
    frame,
    [0, 10],
    [100, 0],
    { extrapolateRight: 'clamp' }
  );

  const pulse = interpolate(
    frame % 30,
    [0, 15, 30],
    [1, 1.1, 1]
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 50,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontFamily,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textAlign: 'center',
          padding: '20px 40px',
          background: 'linear-gradient(45deg, #FF006E, #8338EC)',
          borderRadius: 50,
          transform: `translateY(${slideUp}px) scale(${pulse})`,
          boxShadow: '0 10px 40px rgba(131, 56, 236, 0.5)',
        }}
      >
        {cta}
      </div>
      
      {/* Social Icons */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          marginTop: 30,
          transform: `translateY(${slideUp + 20}px)`,
        }}
      >
        <FollowButton platform="youtube" />
        <FollowButton platform="tiktok" />
        <FollowButton platform="instagram" />
      </div>
    </AbsoluteFill>
  );
};

const SegmentRenderer: React.FC<{ segment: any }> = ({ segment }) => {
  const frame = useCurrentFrame();
  
  if (segment.type === 'text_overlay') {
    return (
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontFamily,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {segment.content}
        </div>
      </AbsoluteFill>
    );
  }

  return null;
};

const FollowButton: React.FC<{ platform: string }> = ({ platform }) => {
  const colors = {
    youtube: '#FF0000',
    tiktok: '#000000',
    instagram: '#E4405F',
  };

  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: colors[platform as keyof typeof colors],
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
      }}
    >
      {platform[0].toUpperCase()}
    </div>
  );
};