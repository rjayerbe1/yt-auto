import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Define which style to use (change this number from 1-30 to test different styles)
const SELECTED_STYLE = 3; // Change this to test different styles!

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

  // Get all words in order with their timing, merging punctuation
  const allWords = useMemo(() => {
    const words: WordTiming[] = [];
    segments.forEach(segment => {
      if (segment.wordTimings) {
        const segmentWords = [...segment.wordTimings];
        const mergedWords: WordTiming[] = [];
        
        for (let i = 0; i < segmentWords.length; i++) {
          const word = segmentWords[i];
          // Check if this is just punctuation
          if (/^[.,!?;:—\-"'`]$/.test(word.word.trim())) {
            // If it's punctuation and we have a previous word, merge it
            if (mergedWords.length > 0) {
              const lastWord = mergedWords[mergedWords.length - 1];
              lastWord.word += word.word;
              lastWord.endTime = word.endTime;
              lastWord.endFrame = word.endFrame;
            } else {
              // If no previous word, keep it as is
              mergedWords.push(word);
            }
          } else {
            // Check if next word is punctuation and merge it
            if (i < segmentWords.length - 1 && /^[.,!?;:—\-"'`]$/.test(segmentWords[i + 1].word.trim())) {
              mergedWords.push({
                ...word,
                word: word.word + segmentWords[i + 1].word,
                endTime: segmentWords[i + 1].endTime,
                endFrame: segmentWords[i + 1].endFrame,
              });
              i++; // Skip the next word since we merged it
            } else {
              mergedWords.push(word);
            }
          }
        }
        
        words.push(...mergedWords);
      }
    });
    return words;
  }, [segments]);

  // Get current visible words (accumulator with 6-word cycles)
  const getVisibleWords = () => {
    if (allWords.length === 0) return [];
    
    // Find the index of the last word that should be visible at current time
    let lastVisibleIndex = -1;
    for (let i = 0; i < allWords.length; i++) {
      if (currentTime >= allWords[i].startTime) {
        lastVisibleIndex = i;
      } else {
        break;
      }
    }
    
    if (lastVisibleIndex === -1) return [];
    
    // Calculate which cycle we're in (0-based)
    const cycleNumber = Math.floor(lastVisibleIndex / 6);
    const cycleStart = cycleNumber * 6;
    const positionInCycle = lastVisibleIndex - cycleStart;
    
    // Get words for current cycle (only up to current word)
    const visibleWords = [];
    for (let i = cycleStart; i <= cycleStart + positionInCycle && i < allWords.length; i++) {
      visibleWords.push({
        word: allWords[i].word,
        isActive: i === lastVisibleIndex,
        index: i - cycleStart, // Position within the cycle (0-5)
      });
    }
    
    return visibleWords;
  };

  const visibleWords = useMemo(() => getVisibleWords(), [currentTime, allWords]);

  // Calculate animation for words - simplified, no animation
  const getWordAnimation = (isActive: boolean) => {
    // Always fully visible, no animation to avoid flickering
    return { opacity: 1 };
  };

  // Split words into two lines (3 words each)
  const firstLine = visibleWords.filter(w => w.index < 3);
  const secondLine = visibleWords.filter(w => w.index >= 3);

  // Style variations
  const getStyleConfig = () => {
    switch(SELECTED_STYLE) {
      case 1: // Clean Modern
        return {
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '72px',
          fontWeight: 'bold',
        };
      case 2: // TikTok Style
        return {
          background: '#000000',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.6)',
          fontSize: '84px',
          fontWeight: '900',
          stroke: true,
        };
      case 3: // Neon
        return {
          background: '#0a0a0a',
          activeColor: '#00ffff',
          inactiveColor: '#ffffff',
          fontSize: '68px',
          fontWeight: 'bold',
          glow: true,
        };
      case 4: // Minimal
        return {
          background: '#FFFFFF',
          activeColor: '#000000',
          inactiveColor: '#999999',
          fontSize: '64px',
          fontWeight: '400',
        };
      case 5: // Gradient
        return {
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.7)',
          fontSize: '76px',
          fontWeight: 'bold',
        };
      default:
        return {
          background: '#1a1a1a',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '72px',
          fontWeight: 'bold',
        };
    }
  };

  const style = getStyleConfig();

  return (
    <div
      style={{
        flex: 1,
        background: style.background,
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
      {/* Words Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          padding: '40px',
        }}
      >
        {/* First Line (words 0-2) */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            minHeight: '100px',
            alignItems: 'center',
          }}
        >
          {firstLine.map((word, idx) => {
            const animation = getWordAnimation(word.isActive);
            return (
              <div
                key={`${word.word}-${word.index}`}
                style={{
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  color: word.isActive ? style.activeColor : style.inactiveColor,
                  opacity: 1,
                  transition: 'color 0.2s ease',
                  textShadow: word.isActive 
                    ? (style.glow 
                      ? `0 0 20px ${style.activeColor}, 0 0 40px ${style.activeColor}` 
                      : '2px 2px 4px rgba(0,0,0,0.5)')
                    : 'none',
                  WebkitTextStroke: style.stroke && word.isActive ? '3px black' : 'none',
                }}
              >
                {word.word}
              </div>
            );
          })}
        </div>

        {/* Second Line (words 3-5) */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            minHeight: '100px',
            alignItems: 'center',
          }}
        >
          {secondLine.map((word, idx) => {
            const animation = getWordAnimation(word.isActive);
            return (
              <div
                key={`${word.word}-${word.index}`}
                style={{
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  color: word.isActive ? style.activeColor : style.inactiveColor,
                  opacity: 1,
                  transition: 'color 0.2s ease',
                  textShadow: word.isActive 
                    ? (style.glow 
                      ? `0 0 20px ${style.activeColor}, 0 0 40px ${style.activeColor}` 
                      : '2px 2px 4px rgba(0,0,0,0.5)')
                    : 'none',
                  WebkitTextStroke: style.stroke && word.isActive ? '3px black' : 'none',
                }}
              >
                {word.word}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          width: '90%',
          height: '4px',
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

      {/* Style indicator */}
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
    </div>
  );
};