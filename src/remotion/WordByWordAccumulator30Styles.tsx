import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Define which style to use (change this number from 1-30 to test different styles)
const SELECTED_STYLE = 30; // Change this to test different styles!

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

  // Split words into two lines (3 words each)
  const firstLine = visibleWords.filter(w => w.index < 3);
  const secondLine = visibleWords.filter(w => w.index >= 3);

  // 30 Different style variations
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
          inactiveColor: 'rgba(255,255,255,0.5)',
          fontSize: '84px',
          fontWeight: '900',
          stroke: true,
        };
      case 3: // Neon Cyan
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
      case 5: // Gradient Tropical
        return {
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.6)',
          fontSize: '76px',
          fontWeight: 'bold',
        };
      case 6: // Instagram Stories
        return {
          background: 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.5)',
          fontSize: '70px',
          fontWeight: 'bold',
        };
      case 7: // YouTube Classic
        return {
          background: '#181818',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.4)',
          fontSize: '62px',
          fontWeight: '500',
        };
      case 8: // Retro Wave
        return {
          background: 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)',
          activeColor: '#FF00FF',
          inactiveColor: '#00FFFF',
          fontSize: '72px',
          fontWeight: 'bold',
          glow: true,
        };
      case 9: // Matrix Green
        return {
          background: '#000000',
          activeColor: '#00FF00',
          inactiveColor: '#008800',
          fontSize: '66px',
          fontWeight: '600',
          fontFamily: 'monospace',
        };
      case 10: // Fire Orange
        return {
          background: '#1a0000',
          activeColor: '#FF6600',
          inactiveColor: '#CC3300',
          fontSize: '74px',
          fontWeight: 'bold',
          glow: true,
        };
      case 11: // Ice Blue
        return {
          background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
          activeColor: '#0099FF',
          inactiveColor: '#666666',
          fontSize: '68px',
          fontWeight: '600',
        };
      case 12: // Purple Dream
        return {
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.4)',
          fontSize: '70px',
          fontWeight: 'bold',
        };
      case 13: // Gold Luxury
        return {
          background: 'linear-gradient(135deg, #232526, #414345)',
          activeColor: '#FFD700',
          inactiveColor: '#C0C0C0',
          fontSize: '72px',
          fontWeight: '700',
        };
      case 14: // Pink Neon
        return {
          background: '#1a1a1a',
          activeColor: '#FF1493',
          inactiveColor: '#FFB6C1',
          fontSize: '70px',
          fontWeight: 'bold',
          glow: true,
        };
      case 15: // Ocean Deep
        return {
          background: 'linear-gradient(180deg, #000428, #004e92)',
          activeColor: '#00BFFF',
          inactiveColor: '#4682B4',
          fontSize: '68px',
          fontWeight: '600',
        };
      case 16: // Sunset
        return {
          background: 'linear-gradient(135deg, #FF512F, #DD2476)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.5)',
          fontSize: '72px',
          fontWeight: 'bold',
        };
      case 17: // Forest Green
        return {
          background: 'linear-gradient(135deg, #134E5E, #71B280)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.5)',
          fontSize: '68px',
          fontWeight: '600',
        };
      case 18: // Electric Purple
        return {
          background: '#000000',
          activeColor: '#9D00FF',
          inactiveColor: '#6B46C1',
          fontSize: '74px',
          fontWeight: 'bold',
          glow: true,
        };
      case 19: // Coral Reef
        return {
          background: 'linear-gradient(45deg, #FF6B9D, #FFC107)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.5)',
          fontSize: '70px',
          fontWeight: 'bold',
        };
      case 20: // Dark Mode
        return {
          background: '#121212',
          activeColor: '#BB86FC',
          inactiveColor: '#666666',
          fontSize: '66px',
          fontWeight: '500',
        };
      case 21: // Mint Fresh
        return {
          background: 'linear-gradient(135deg, #00b09b, #96c93d)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.5)',
          fontSize: '68px',
          fontWeight: '600',
        };
      case 22: // Cherry Blossom
        return {
          background: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
          activeColor: '#D2001F',
          inactiveColor: '#8B4513',
          fontSize: '70px',
          fontWeight: 'bold',
        };
      case 23: // Arctic
        return {
          background: 'linear-gradient(135deg, #e6dada, #274046)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.4)',
          fontSize: '72px',
          fontWeight: '700',
        };
      case 24: // Lava
        return {
          background: 'linear-gradient(45deg, #870000, #190A05)',
          activeColor: '#FFA500',
          inactiveColor: '#8B4513',
          fontSize: '74px',
          fontWeight: 'bold',
          glow: true,
        };
      case 25: // Pastel
        return {
          background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
          activeColor: '#FF1493',
          inactiveColor: '#778899',
          fontSize: '66px',
          fontWeight: '600',
        };
      case 26: // Cyber Yellow
        return {
          background: '#000000',
          activeColor: '#FFFF00',
          inactiveColor: '#808000',
          fontSize: '72px',
          fontWeight: 'bold',
          stroke: true,
        };
      case 27: // Royal Blue
        return {
          background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '70px',
          fontWeight: '700',
        };
      case 28: // Vintage
        return {
          background: 'linear-gradient(135deg, #8e9eab, #eef2f3)',
          activeColor: '#8B4513',
          inactiveColor: '#696969',
          fontSize: '68px',
          fontWeight: '600',
        };
      case 29: // Neon Green
        return {
          background: '#0a0a0a',
          activeColor: '#39FF14',
          inactiveColor: '#32CD32',
          fontSize: '72px',
          fontWeight: 'bold',
          glow: true,
        };
      case 30: // Cosmic
        return {
          background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
          activeColor: '#00D4FF',
          inactiveColor: '#4169E1',
          fontSize: '74px',
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
        fontFamily: style.fontFamily || 'system-ui, -apple-system, sans-serif',
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
          {firstLine.map((word, idx) => (
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
          ))}
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
          {secondLine.map((word, idx) => (
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
          ))}
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