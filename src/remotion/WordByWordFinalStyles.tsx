import React, { useMemo } from 'react';
import { 
  useCurrentFrame, 
  useVideoConfig,
  OffthreadVideo,
  AbsoluteFill,
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
  videoStyle?: number; // Style selection (1-6)
  brollVideos?: string[]; // Array of B-roll video paths
}

export const WordByWordVideo: React.FC<WordByWordVideoProps> = ({
  title,
  segments,
  totalDuration,
  videoStyle = 1, // Default to style 1
  brollVideos = [], // B-roll videos array
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Get all words in order with their timing, merging punctuation and contractions
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
          } 
          // Check if this word starts with apostrophe (like 've, 's, 'll, 't, etc.)
          else if (/^'/.test(word.word) && mergedWords.length > 0) {
            // Merge with previous word (contractions like you've, don't, it's)
            const lastWord = mergedWords[mergedWords.length - 1];
            lastWord.word += word.word;
            lastWord.endTime = word.endTime;
            lastWord.endFrame = word.endFrame;
          }
          else {
            // Check if next word is punctuation or a contraction and merge it
            if (i < segmentWords.length - 1) {
              const nextWord = segmentWords[i + 1].word.trim();
              const currentWordTrimmed = word.word.trim();
              
              // Check for punctuation, contractions, or currency/units
              // Merge if:
              // - Next word is punctuation
              // - Next word is a contraction (starts with ')
              // - Current is $ and next is a number ($100)
              // - Current is number and next is % or unit (100%, 50km)
              // - Current ends with $ and next is number (USD$50)
              if (/^[.,!?;:—\-"'`]$/.test(nextWord) || 
                  /^'/.test(nextWord) ||
                  (currentWordTrimmed === '$' && /^\d/.test(nextWord)) ||
                  (/\$$/.test(currentWordTrimmed) && /^\d/.test(nextWord)) ||
                  (/\d$/.test(currentWordTrimmed) && /^(%|km|kg|m|cm|mm|ft|in|mph|kph)/.test(nextWord))) {
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
    
    // Track if we're inside quotes (for special terms)
    let insideQuotes = false;
    
    // Check if any word before cycleStart has an opening quote
    for (let i = 0; i < cycleStart && i < allWords.length; i++) {
      const word = allWords[i].word;
      // Only consider it a quote start if it's at the beginning and longer than 2 chars
      // This avoids contractions like "it's" but catches "'unconscious"
      if ((word.startsWith("'") && word.length > 2 && !word.includes("'t") && !word.includes("'s") && 
           !word.includes("'re") && !word.includes("'ve") && !word.includes("'ll") && !word.includes("'d")) || 
          word.startsWith('"')) {
        insideQuotes = true;
      }
      if ((word.endsWith("'") && !word.includes("n't") && word.length > 2) || 
          word.endsWith('"') || word.endsWith("'.") || word.endsWith('".')) {
        insideQuotes = false;
      }
    }
    
    // Get words for current cycle (only up to current word)
    const visibleWords = [];
    for (let i = cycleStart; i <= cycleStart + positionInCycle && i < allWords.length; i++) {
      const word = allWords[i].word;
      
      // Check if this word starts quotes (but not contractions)
      if ((word.startsWith("'") && word.length > 2 && !word.includes("'t") && !word.includes("'s") && 
           !word.includes("'re") && !word.includes("'ve") && !word.includes("'ll") && !word.includes("'d")) || 
          word.startsWith('"')) {
        insideQuotes = true;
      }
      
      visibleWords.push({
        word: allWords[i].word,
        isActive: i === lastVisibleIndex,
        index: i - cycleStart, // Position within the cycle (0-5)
        isSpecialTerm: insideQuotes, // Mark if inside quotes
      });
      
      // Check if this word ends quotes (but not contractions like "won't")
      if ((word.endsWith("'") && !word.includes("n't") && word.length > 2) || 
          word.endsWith('"') || word.endsWith("'.") || word.endsWith('".')) {
        insideQuotes = false;
      }
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
      case 1: // Clean Modern - Purple gradient with gold text (BEST FOR B-ROLL)
        return {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontSize: '72px',
          fontWeight: 'bold',
          name: 'Clean Modern - Purple/Gold',
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

  // Dynamic B-roll selection based on content rhythm
  const getCurrentBrollVideoAndTiming = () => {
    if (!brollVideos || brollVideos.length === 0) {
      return { video: null, startFrom: 0, shouldLoop: true };
    }
    
    // DYNAMIC CHANGE INTERVALS
    // Change B-roll every 2-5 seconds for maximum engagement
    const minChangeInterval = 2; // seconds
    const maxChangeInterval = 5; // seconds
    
    // Calculate which "scene" we're in based on time intervals
    // This creates dynamic cuts that aren't tied to segments
    const sceneNumber = Math.floor(currentTime / 3.5); // Change roughly every 3.5 seconds
    
    // Add some variation to the interval
    // Use a pseudo-random pattern based on scene number
    const variationPattern = [2.5, 4, 3, 4.5, 2, 3.5, 5, 2.5, 3, 4];
    const changeInterval = variationPattern[sceneNumber % variationPattern.length];
    
    // Calculate actual scene based on varied intervals
    let accumulatedTime = 0;
    let actualScene = 0;
    for (let i = 0; i < 100; i++) { // Safety limit
      const interval = variationPattern[i % variationPattern.length];
      if (accumulatedTime + interval > currentTime) {
        actualScene = i;
        break;
      }
      accumulatedTime += interval;
    }
    
    // Select video based on scene with variety
    // Use different selection patterns to avoid repetition
    let videoIndex;
    if (brollVideos.length >= 10) {
      // Lots of videos - use them all with a shuffle pattern
      const shufflePattern = [0, 5, 2, 7, 1, 9, 4, 6, 3, 8];
      const patternIndex = actualScene % shufflePattern.length;
      videoIndex = shufflePattern[patternIndex] % brollVideos.length;
    } else if (brollVideos.length >= 5) {
      // Good variety - alternate with some jumps
      const pattern = [0, 2, 4, 1, 3];
      videoIndex = pattern[actualScene % pattern.length] % brollVideos.length;
    } else {
      // Few videos - cycle through them
      videoIndex = actualScene % brollVideos.length;
    }
    
    // Calculate random start point in the video for variety
    // Each scene starts at a different point in the B-roll
    const videoStartOptions = [0, 2, 5, 1, 3, 4, 6, 1.5, 3.5, 2.5];
    const startOffset = videoStartOptions[actualScene % videoStartOptions.length];
    
    // Calculate how far into current scene we are
    const sceneStartTime = accumulatedTime;
    const timeIntoScene = currentTime - sceneStartTime;
    
    return {
      video: brollVideos[videoIndex],
      startFrom: startOffset + timeIntoScene, // Start from varied point + scene progress
      shouldLoop: false // Don't loop, we'll switch to next video soon
    };
  };

  const { video: currentBrollVideo, startFrom: brollStartTime, shouldLoop } = getCurrentBrollVideoAndTiming();

  return (
    <AbsoluteFill>
      {/* Background Layer - Either B-roll video or colored background */}
      {currentBrollVideo ? (
        <>
          <AbsoluteFill>
            <OffthreadVideo
              src={staticFile(currentBrollVideo)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              muted
              loop={shouldLoop}
              playbackRate={1}
              startFrom={Math.floor(brollStartTime * 30)} // Convert seconds to frames (30 fps)
            />
          </AbsoluteFill>
          {/* Dark overlay for better text visibility with slight vignette effect */}
          <AbsoluteFill
            style={{
              background: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
            }}
          />
        </>
      ) : (
        <AbsoluteFill
          style={{
            background: style.background,
          }}
        />
      )}

      {/* Text Content Layer */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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
          {firstLine.map((word, idx) => {
            // Adjust font size for long words
            const baseSize = parseInt(style.fontSize);
            const wordLength = word.word.length;
            let adjustedSize = baseSize;
            
            if (wordLength > 15) adjustedSize = baseSize * 0.6;
            else if (wordLength > 12) adjustedSize = baseSize * 0.7;
            else if (wordLength > 10) adjustedSize = baseSize * 0.85;
            
            // Use the isSpecialTerm flag from the word object
            const isSpecialTerm = word.isSpecialTerm || false;
            
            return (
              <div
                key={`${word.word}-${word.index}`}
                style={{
                  fontSize: `${adjustedSize}px`,
                  fontWeight: style.fontWeight,
                  fontStyle: isSpecialTerm ? 'italic' : 'normal',
                  color: word.isActive ? style.activeColor : style.inactiveColor,
                  opacity: 1,
                  transition: 'color 0.2s ease',
                  textShadow: currentBrollVideo 
                    ? '2px 2px 8px rgba(0,0,0,0.9)' // Stronger shadow when video background
                    : word.isActive 
                      ? '2px 2px 4px rgba(0,0,0,0.5)'
                      : 'none',
                  WebkitTextStroke: currentBrollVideo ? '1px rgba(0,0,0,0.5)' : 'none',
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
            gap: '25px', // Slightly reduced from 30px
            minHeight: '90px', // Slightly reduced from 100px
            alignItems: 'center',
          }}
        >
          {secondLine.map((word, idx) => {
            // Adjust font size for long words
            const baseSize = parseInt(style.fontSize);
            const wordLength = word.word.length;
            let adjustedSize = baseSize;
            
            if (wordLength > 15) adjustedSize = baseSize * 0.6;
            else if (wordLength > 12) adjustedSize = baseSize * 0.7;
            else if (wordLength > 10) adjustedSize = baseSize * 0.85;
            
            // Use the isSpecialTerm flag from the word object
            const isSpecialTerm = word.isSpecialTerm || false;
            
            return (
              <div
                key={`${word.word}-${word.index}`}
                style={{
                  fontSize: `${adjustedSize}px`,
                  fontWeight: style.fontWeight,
                  fontStyle: isSpecialTerm ? 'italic' : 'normal',
                  color: word.isActive ? style.activeColor : style.inactiveColor,
                  opacity: 1,
                  transition: 'color 0.2s ease',
                  textShadow: currentBrollVideo 
                    ? '2px 2px 8px rgba(0,0,0,0.9)' // Stronger shadow when video background
                    : word.isActive 
                      ? '2px 2px 4px rgba(0,0,0,0.5)'
                      : 'none',
                  WebkitTextStroke: currentBrollVideo ? '1px rgba(0,0,0,0.5)' : 'none',
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
      </AbsoluteFill>
    </AbsoluteFill>
  );
};