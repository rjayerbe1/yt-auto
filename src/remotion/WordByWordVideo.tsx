import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { createTikTokStyleCaptions } from '@remotion/captions';

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
  captions?: Caption[];  // Use actual Caption[] from Whisper
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

  // Find current segment and words to display
  const currentSegment = segments.find(
    segment => currentTime >= segment.startTime && currentTime < segment.endTime
  );

  // Get only the current word being spoken
  const getCurrentWord = (): WordTiming | null => {
    for (const segment of segments) {
      if (segment.wordTimings) {
        // Find the word that is currently being spoken
        const currentWord = segment.wordTimings.find(
          wordTiming => currentTime >= wordTiming.startTime && currentTime < wordTiming.endTime
        );
        
        if (currentWord) {
          return currentWord;
        }
      }
    }
    return null;
  };
  
  // Get words for context using Caption[] if available
  const getContextWords = () => {
    const currentTimeMs = currentTime * 1000;
    
    // First try to use Caption[] if available
    const allCaptions: Caption[] = [];
    for (const segment of segments) {
      if (segment.captions && segment.captions.length > 0) {
        allCaptions.push(...segment.captions);
      }
    }
    
    // If we have Caption data, use it for precise timing
    if (allCaptions.length > 0) {
      const words: { caption: Caption; position: 'far-previous' | 'previous' | 'current' | 'next' | 'far-next' }[] = [];
      
      // Find current caption
      const currentIndex = allCaptions.findIndex(
        cap => currentTimeMs >= cap.startMs && currentTimeMs < cap.endMs
      );
      
      if (currentIndex === -1) return [];
      
      const contextRange = 2;
      
      // Add previous words
      for (let i = Math.max(0, currentIndex - contextRange); i < currentIndex; i++) {
        const distance = currentIndex - i;
        words.push({ 
          caption: allCaptions[i], 
          position: distance > 1 ? 'far-previous' : 'previous' 
        });
      }
      
      // Add current word
      words.push({ caption: allCaptions[currentIndex], position: 'current' });
      
      // Add next words
      for (let i = currentIndex + 1; i < Math.min(allCaptions.length, currentIndex + contextRange + 1); i++) {
        const distance = i - currentIndex;
        words.push({ 
          caption: allCaptions[i], 
          position: distance > 1 ? 'far-next' : 'next' 
        });
      }
      
      return words.map(item => ({
        word: {
          word: item.caption.text,
          startTime: item.caption.startMs / 1000,
          endTime: item.caption.endMs / 1000,
          startFrame: Math.floor(item.caption.startMs / 1000 * fps),
          endFrame: Math.floor(item.caption.endMs / 1000 * fps)
        },
        position: item.position
      }));
    }
    
    // Fallback to WordTiming if no Caption data
    const words: { word: WordTiming; position: 'far-previous' | 'previous' | 'current' | 'next' | 'far-next' }[] = [];
    
    const allWords: WordTiming[] = [];
    for (const segment of segments) {
      if (segment.wordTimings) {
        allWords.push(...segment.wordTimings);
      }
    }
    
    const currentIndex = allWords.findIndex(
      word => currentTime >= word.startTime && currentTime < word.endTime
    );
    
    if (currentIndex === -1) return words;
    
    const contextRange = 2;
    
    for (let i = Math.max(0, currentIndex - contextRange); i < currentIndex; i++) {
      const distance = currentIndex - i;
      words.push({ 
        word: allWords[i], 
        position: distance > 1 ? 'far-previous' : 'previous' 
      });
    }
    
    words.push({ word: allWords[currentIndex], position: 'current' });
    
    for (let i = currentIndex + 1; i < Math.min(allWords.length, currentIndex + contextRange + 1); i++) {
      const distance = i - currentIndex;
      words.push({ 
        word: allWords[i], 
        position: distance > 1 ? 'far-next' : 'next' 
      });
    }
    
    return words;
  };

  // Use memoization to prevent unnecessary recalculations
  const currentWord = useMemo(() => getCurrentWord(), [currentTime, segments]);
  const contextWords = useMemo(() => getContextWords(), [currentTime, segments, fps]);
  
  // Calculate animation values for the current word
  const wordAnimation = useMemo(() => {
    if (!currentWord) return { scale: 0, opacity: 0 };
    
    // Find when this word started (in frames)
    const wordStartFrame = Math.floor(currentWord.startTime * fps);
    const wordEndFrame = Math.floor(currentWord.endTime * fps);
    const frameSinceStart = frame - wordStartFrame;
    const wordDurationFrames = wordEndFrame - wordStartFrame;
    
    // Simple fade in at start (2 frames)
    if (frameSinceStart < 2) {
      const progress = frameSinceStart / 2;
      return {
        scale: 1,
        opacity: interpolate(progress, [0, 1], [0, 1]),
      };
    }
    
    // Stay visible for the entire word duration
    if (frameSinceStart < wordDurationFrames) {
      return {
        scale: 1,
        opacity: 1,
      };
    }
    
    // Word has ended
    return {
      scale: 0,
      opacity: 0,
    };
  }, [currentWord, frame, fps]);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      {/* Dynamic gradient background - changes color */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at center, 
            hsl(${(frame * 2) % 360}, 50%, 20%), 
            #000000)`,
          opacity: 0.9,
        }}
      />
      
      {/* Animated particles/sparkles effect */}
      {currentWord && wordAnimation.scale > 0.9 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '45%',
              left: '20%',
              fontSize: '40px',
              opacity: wordAnimation.opacity * 0.6,
              transform: `translateY(${Math.sin(frame * 0.1) * 20}px)`,
            }}
          >
            ✨
          </div>
          <div
            style={{
              position: 'absolute',
              top: '55%',
              right: '20%',
              fontSize: '35px',
              opacity: wordAnimation.opacity * 0.5,
              transform: `translateY(${Math.cos(frame * 0.1) * 20}px)`,
            }}
          >
            ⭐
          </div>
          <div
            style={{
              position: 'absolute',
              top: '40%',
              right: '25%',
              fontSize: '30px',
              opacity: wordAnimation.opacity * 0.4,
              transform: `rotate(${frame * 2}deg)`,
            }}
          >
            💫
          </div>
        </>
      )}

      {/* Single word display - viral style animation */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Show only the current word - no context to avoid flickering */}
        {currentWord && (
          <div
            style={{
              fontSize: '120px',
              fontWeight: '900',
              color: '#FFD700',
              textTransform: 'uppercase',
              fontFamily: 'Impact, Arial Black, sans-serif',
              letterSpacing: '3px',
              transform: `scale(${wordAnimation.scale})`,
              opacity: wordAnimation.opacity,
              textShadow: `
                0 0 30px rgba(255, 215, 0, 0.8),
                3px 3px 0px #000,
                -3px -3px 0px #000,
                3px -3px 0px #000,
                -3px 3px 0px #000,
                0 0 60px rgba(255, 215, 0, 0.4)
              `,
              transformOrigin: 'center center',
            }}
          >
            {currentWord.word}
          </div>
        )}
        
        {/* Alternative style: Karaoke-style line
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {currentSegment && currentSegment.wordTimings && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                padding: '30px',
                maxWidth: '90%',
              }}
            >
              {currentSegment.wordTimings.map((wordTiming) => {
                const isActive = currentTime >= wordTiming.startTime && currentTime < wordTiming.endTime;
                const isPast = currentTime >= wordTiming.endTime;
                
                return (
                  <span
                    key={`${wordTiming.word}-${wordTiming.startTime}`}
                    style={{
                      fontSize: isActive ? '80px' : '60px',
                      fontWeight: isActive ? '900' : '700',
                      color: isActive ? '#FFD700' : (isPast ? '#666666' : '#CCCCCC'),
                      opacity: isPast ? 0.5 : 1,
                      textTransform: 'uppercase',
                      fontFamily: 'Arial Black, sans-serif',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                      textShadow: isActive 
                        ? '0 0 20px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)'
                        : '1px 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {wordTiming.word}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        */}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          width: '80%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            width: `${(currentTime / totalDuration) * 100}%`,
            height: '100%',
            backgroundColor: '#FFD700',
            borderRadius: '2px',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

    </div>
  );
};