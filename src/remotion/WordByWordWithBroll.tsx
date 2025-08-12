import React, { useMemo } from 'react';
import { 
  useCurrentFrame, 
  useVideoConfig, 
  Video, 
  AbsoluteFill,
  OffthreadVideo,
  staticFile 
} from 'remotion';

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
  videoStyle?: number;
  brollVideos?: string[]; // Array of B-roll video paths
}

export const WordByWordVideo: React.FC<WordByWordVideoProps> = ({
  title,
  segments,
  totalDuration,
  videoStyle = 1,
  brollVideos = [],
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
    switch(videoStyle) {
      case 1: // Clean Modern (was style 1)
        return {
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '72px',
          fontWeight: 'bold',
          name: 'Clean Modern',
        };
      case 2: // Minimal (was style 4)
        return {
          activeColor: '#000000',
          inactiveColor: '#666666',
          fontSize: '64px',
          fontWeight: '400',
          name: 'Minimal',
        };
      case 3: // Gradient Tropical (was style 5)
        return {
          activeColor: '#FFFFFF',
          inactiveColor: 'rgba(255,255,255,0.6)',
          fontSize: '76px',
          fontWeight: 'bold',
          name: 'Gradient Tropical',
        };
      case 4: // Matrix Green (was style 9)
        return {
          activeColor: '#00FF00',
          inactiveColor: '#008800',
          fontSize: '66px',
          fontWeight: '600',
          fontFamily: 'monospace',
          name: 'Matrix Green',
        };
      case 5: // Gold Luxury (was style 13)
        return {
          activeColor: '#FFD700',
          inactiveColor: '#C0C0C0',
          fontSize: '72px',
          fontWeight: '700',
          name: 'Gold Luxury',
        };
      case 6: // Cherry Blossom (was style 22)
        return {
          activeColor: '#D2001F',
          inactiveColor: '#FFFFFF',
          fontSize: '70px',
          fontWeight: 'bold',
          name: 'Cherry Blossom',
        };
      default:
        return {
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '72px',
          fontWeight: 'bold',
          name: 'Default',
        };
    }
  };

  const style = getStyleConfig();

  // Select B-roll video based on current time
  const getCurrentBrollVideo = () => {
    if (!brollVideos || brollVideos.length === 0) {
      // Use default broll videos if none provided
      const defaultBrolls = [
        'broll/broll-3754902.mp4',
        'broll/broll-5054428.mp4',
        'broll/broll-5989753.mp4',
        'broll/broll-6406028.mp4',
        'broll/broll-6781972.mp4',
      ];
      
      // Cycle through videos every 5 seconds
      const videoIndex = Math.floor(currentTime / 5) % defaultBrolls.length;
      return defaultBrolls[videoIndex];
    }
    
    // Use provided broll videos
    const videoDuration = totalDuration / brollVideos.length;
    const videoIndex = Math.min(
      Math.floor(currentTime / videoDuration),
      brollVideos.length - 1
    );
    return brollVideos[videoIndex];
  };

  const currentBrollVideo = getCurrentBrollVideo();

  return (
    <AbsoluteFill>
      {/* Background Video Layer */}
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile(currentBrollVideo)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          muted
          loop
          playbackRate={1}
        />
        {/* Dark overlay for better text visibility */}
        <AbsoluteFill
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
        />
      </AbsoluteFill>

      {/* Text Overlay Layer */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: style.fontFamily || 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Words Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            padding: '40px',
          }}
        >
          {/* First Line (words 0-2) */}
          <div
            style={{
              display: 'flex',
              gap: '25px',
              minHeight: '90px',
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
                  textShadow: '2px 2px 8px rgba(0,0,0,0.9)', // Stronger shadow for visibility
                  WebkitTextStroke: '1px rgba(0,0,0,0.5)', // Outline for better readability
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
              gap: '25px',
              minHeight: '90px',
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
                  textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                  WebkitTextStroke: '1px rgba(0,0,0,0.5)',
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
      </AbsoluteFill>
    </AbsoluteFill>
  );
};