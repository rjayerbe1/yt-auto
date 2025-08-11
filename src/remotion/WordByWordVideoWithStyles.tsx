import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import * as Styles from './styles/VideoStyles';

// Define which style to use (change this number from 1-30 to test different styles)
const SELECTED_STYLE = 21; // Change this to test different styles!

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  startFrame: number;
  endFrame: number;
}

interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number;
  confidence: number | null;
}

interface Segment {
  text: string;
  audioFile: string;
  duration: number;
  startTime: number;
  endTime: number;
  wordTimings?: WordTiming[];
  captions?: Caption[];
}

interface WordByWordVideoProps {
  title: string;
  segments: Segment[];
  totalDuration: number;
}

export const WordByWordVideo: React.FC<WordByWordVideoProps> = ({
  title,
  segments,
  totalDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Get current word
  const getCurrentWord = (): WordTiming | null => {
    for (const segment of segments) {
      if (segment.wordTimings) {
        const currentWord = segment.wordTimings.find(
          wordTiming => currentTime >= wordTiming.startTime && currentTime < wordTiming.endTime
        );
        if (currentWord) return currentWord;
      }
    }
    return null;
  };

  const currentWord = useMemo(() => getCurrentWord(), [currentTime, segments]);

  // Calculate animation
  const wordAnimation = useMemo(() => {
    if (!currentWord) return { scale: 0, opacity: 0 };
    
    const wordStartFrame = Math.floor(currentWord.startTime * fps);
    const wordEndFrame = Math.floor(currentWord.endTime * fps);
    const frameSinceStart = frame - wordStartFrame;
    const wordDurationFrames = wordEndFrame - wordStartFrame;
    
    // Simple fade in
    if (frameSinceStart < 2) {
      const progress = frameSinceStart / 2;
      return {
        scale: 1,
        opacity: interpolate(progress, [0, 1], [0, 1]),
      };
    }
    
    // Stay visible
    if (frameSinceStart < wordDurationFrames) {
      return { scale: 1, opacity: 1 };
    }
    
    return { scale: 0, opacity: 0 };
  }, [currentWord, frame, fps]);

  // Style components array
  const styleComponents = [
    Styles.KaraokeBottomBar,
    Styles.TikTokStyle,
    Styles.NeonGlow,
    Styles.TypewriterEffect,
    Styles.ComicBookStyle,
    Styles.Minimalist,
    Styles.InstagramStories,
    Styles.YouTubeSubtitle,
    Styles.GlitchEffect,
    Styles.BouncingLetters,
    Styles.GradientText,
    Styles.Shadow3D,
    Styles.OutlineOnly,
    Styles.RetroWave,
    Styles.BubbleStyle,
    Styles.SplitColor,
    Styles.MatrixStyle,
    Styles.HandwrittenStyle,
    Styles.FireText,
    Styles.IceText,
    Styles.StampEffect,
    Styles.PixelatedStyle,
    Styles.MetallicShine,
    Styles.RainbowAnimation,
    Styles.NewspaperHeadline,
    Styles.EmojiBackground,
    Styles.GraffitiStyle,
    Styles.Glassmorphism,
    Styles.SpotlightEffect,
    Styles.Rotating3D,
  ];

  // Select the style component
  const SelectedStyle = styleComponents[SELECTED_STYLE - 1];

  // Get background based on style
  const getBackground = () => {
    switch(SELECTED_STYLE) {
      case 1: // Karaoke
        return 'linear-gradient(180deg, #1a1a2e, #16213e)';
      case 2: // TikTok
        return '#000000';
      case 3: // Neon
        return '#0a0a0a';
      case 4: // Typewriter
        return '#1a1a1a';
      case 5: // Comic
        return 'linear-gradient(45deg, #FF6B6B, #4ECDC4)';
      case 6: // Minimalist
        return '#FFFFFF';
      case 7: // Instagram
        return 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c)';
      case 8: // YouTube
        return '#181818';
      case 9: // Glitch
        return '#000000';
      case 10: // Bouncing
        return 'linear-gradient(135deg, #667eea, #764ba2)';
      case 11: // Gradient
        return '#1a1a1a';
      case 12: // 3D Shadow
        return 'linear-gradient(135deg, #f5f7fa, #c3cfe2)';
      case 13: // Outline
        return 'radial-gradient(circle, #434343, #000000)';
      case 14: // RetroWave
        return 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)';
      case 15: // Bubble
        return 'linear-gradient(135deg, #667eea, #764ba2)';
      case 16: // Split Color
        return '#1a1a1a';
      case 17: // Matrix
        return '#000000';
      case 18: // Handwritten
        return 'linear-gradient(135deg, #f5f7fa, #c3cfe2)';
      case 19: // Fire
        return '#1a0000';
      case 20: // Ice
        return 'linear-gradient(135deg, #e0f7fa, #b2ebf2)';
      case 21: // Stamp
        return '#f5f5f5';
      case 22: // Pixelated
        return '#000000';
      case 23: // Metallic
        return 'linear-gradient(135deg, #232526, #414345)';
      case 24: // Rainbow
        return '#000000';
      case 25: // Newspaper
        return '#f4f4f4';
      case 26: // Emoji
        return 'linear-gradient(135deg, #ff006e, #8338ec, #3a86ff)';
      case 27: // Graffiti
        return 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="brick" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"%3E%3Crect x="0" y="0" width="100" height="50" fill="%23a52a2a"/%3E%3Crect x="0" y="50" width="100" height="50" fill="%238b0000"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23brick)"/%3E%3C/svg%3E")';
      case 28: // Glassmorphism
        return 'linear-gradient(135deg, #667eea, #764ba2)';
      case 29: // Spotlight
        return '#000000';
      case 30: // Rotating 3D
        return 'radial-gradient(circle, #1a1a2e, #0a0a0a)';
      default:
        return '#000000';
    }
  };

  return (
    <div
      style={{
        flex: 1,
        background: getBackground(),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Style indicator (shows which style is selected) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#FFFFFF',
          fontSize: '14px',
          opacity: 0.5,
          fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.5)',
          padding: '5px 10px',
          borderRadius: '5px',
        }}
      >
        Style #{SELECTED_STYLE}
      </div>

      {/* Render selected style */}
      <SelectedStyle 
        currentWord={currentWord}
        wordAnimation={wordAnimation}
        frame={frame}
        fps={fps}
      />

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          width: '90%',
          height: '3px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            width: `${(currentTime / totalDuration) * 100}%`,
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  );
};