import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// Define which style to use (1-6 for the selected styles)
const SELECTED_STYLE = 6; // Change this to test different styles!

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

  // 6 Selected styles that user liked
  const getStyleConfig = () => {
    switch(SELECTED_STYLE) {
      case 1: // Clean Modern (was style 1)
        return {
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '72px',
          fontWeight: 'bold',
          name: 'Clean Modern',
        };
      case 2: // Minimal (was style 4)
        return {
          background: '#FFFFFF',
          activeColor: '#000000',
          inactiveColor: '#999999',
          fontSize: '64px',
          fontWeight: '400',
          name: 'Minimal',
        };
      case 3: // Gradient Tropical (was style 5)
        return {
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.6)',
          fontSize: '76px',
          fontWeight: 'bold',
          name: 'Gradient Tropical',
        };
      case 4: // Matrix Green (was style 9)
        return {
          background: '#000000',
          activeColor: '#00FF00',
          inactiveColor: '#008800',
          fontSize: '66px',
          fontWeight: '600',
          fontFamily: 'monospace',
          name: 'Matrix Green',
        };
      case 5: // Gold Luxury (was style 13)
        return {
          background: 'linear-gradient(135deg, #232526, #414345)',
          activeColor: '#FFD700',
          inactiveColor: '#C0C0C0',
          fontSize: '72px',
          fontWeight: '700',
          name: 'Gold Luxury',
        };
      case 6: // Cherry Blossom (was style 22)
        return {
          background: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
          activeColor: '#D2001F',
          inactiveColor: '#8B4513',
          fontSize: '70px',
          fontWeight: 'bold',
          name: 'Cherry Blossom',
        };
      default:
        return {
          background: '#1a1a1a',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '72px',
          fontWeight: 'bold',
          name: 'Default',
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
      {/* Words Container - REDUCED GAP FROM 40px to 20px */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px', // REDUCED from 40px - lines are closer now
          padding: '40px',
        }}
      >
        {/* First Line (words 0-2) */}
        <div
          style={{
            display: 'flex',
            gap: '25px', // Slightly reduced from 30px
            minHeight: '90px', // Slightly reduced from 100px
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
                  ? '2px 2px 4px rgba(0,0,0,0.5)'
                  : 'none',
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
            gap: '25px', // Slightly reduced from 30px
            minHeight: '90px', // Slightly reduced from 100px
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
                  ? '2px 2px 4px rgba(0,0,0,0.5)'
                  : 'none',
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

      {/* Style name indicator */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: style.name === 'Minimal' || style.name === 'Cherry Blossom' ? '#333' : '#FFFFFF',
          fontSize: '14px',
          opacity: 0.5,
          fontFamily: 'monospace',
          background: style.name === 'Minimal' || style.name === 'Cherry Blossom' 
            ? 'rgba(0,0,0,0.1)' 
            : 'rgba(0,0,0,0.5)',
          padding: '5px 10px',
          borderRadius: '5px',
        }}
      >
        {style.name}
      </div>
    </div>
  );
};