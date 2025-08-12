import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from 'remotion';

/**
 * Enhanced component that adapts text size based on content length
 */
export const WordByWordAdaptiveText: React.FC<{
  segments: any[];
  style?: number;
  brollVideos?: string[];
}> = ({ segments, style = 1, brollVideos = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Calculate adaptive font size based on text length
  const getAdaptiveFontSize = (text: string, baseSize: number = 130): number => {
    const charCount = text.length;
    
    // Adaptive sizing rules
    if (charCount <= 15) return baseSize; // Short text: full size
    if (charCount <= 20) return baseSize * 0.9; // Medium text: 90%
    if (charCount <= 25) return baseSize * 0.8; // Long text: 80%
    if (charCount <= 30) return baseSize * 0.7; // Very long: 70%
    if (charCount <= 35) return baseSize * 0.6; // Extra long: 60%
    return baseSize * 0.5; // Ultra long: 50%
  };

  // Get style configuration
  const getStyleConfig = (styleNum: number) => {
    switch (styleNum) {
      case 1: // Clean Modern - Purple gradient with gold text
        return {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontFamily: 'Montserrat, Arial Black, sans-serif',
        };
      default:
        return {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
          activeColor: '#FFD700',
          inactiveColor: '#FFFFFF',
          fontFamily: 'Montserrat, Arial Black, sans-serif',
        };
    }
  };

  const styleConfig = getStyleConfig(style);

  // Process all words from segments
  const allWords = useMemo(() => {
    const words: any[] = [];
    segments.forEach(segment => {
      if (segment.wordTimings && segment.wordTimings.length > 0) {
        words.push(...segment.wordTimings);
      }
    });
    return words;
  }, [segments]);

  // Get current visible words (3 lines, max 2 words per line)
  const getVisibleWords = () => {
    if (allWords.length === 0) return [];
    
    // Find current word index
    let currentWordIndex = -1;
    for (let i = 0; i < allWords.length; i++) {
      if (currentTime >= allWords[i].startTime) {
        currentWordIndex = i;
      } else {
        break;
      }
    }
    
    if (currentWordIndex === -1) return [];
    
    // Build lines (max 2 words per line, 3 lines total)
    const lines: Array<{ words: any[], isActive: boolean }> = [];
    const startIndex = Math.max(0, currentWordIndex - 5); // Show up to 6 words
    
    for (let i = startIndex; i <= currentWordIndex && lines.length < 3; i += 2) {
      const lineWords = [];
      lineWords.push(allWords[i]);
      if (i + 1 <= currentWordIndex && i + 1 < allWords.length) {
        lineWords.push(allWords[i + 1]);
      }
      
      lines.push({
        words: lineWords,
        isActive: i === currentWordIndex || i + 1 === currentWordIndex
      });
    }
    
    return lines;
  };

  const visibleLines = getVisibleWords();

  // Current B-roll video
  const currentBrollIndex = Math.floor(currentTime / 3) % Math.max(1, brollVideos.length);
  const currentBroll = brollVideos[currentBrollIndex];

  return (
    <AbsoluteFill>
      {/* B-roll Background */}
      {currentBroll && (
        <AbsoluteFill style={{ zIndex: 0 }}>
          <video
            src={currentBroll}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            autoPlay
            muted
            loop
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.4) 100%)',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Text Overlay */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
          padding: '80px 40px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            width: '100%',
            maxWidth: '95%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {visibleLines.map((line, lineIndex) => {
            // Calculate combined text length for the line
            const lineText = line.words.map(w => w.word).join(' ');
            const fontSize = getAdaptiveFontSize(lineText);
            
            return (
              <div
                key={lineIndex}
                style={{
                  padding: '25px 35px',
                  background: line.isActive ? styleConfig.background : 'transparent',
                  borderRadius: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px',
                  minHeight: '120px',
                  opacity: line.isActive ? 1 : 0.7,
                  transform: line.isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
              >
                {line.words.map((word, wordIndex) => {
                  const isCurrentWord = currentTime >= word.startTime && currentTime < word.endTime;
                  
                  return (
                    <span
                      key={wordIndex}
                      style={{
                        fontFamily: styleConfig.fontFamily,
                        fontSize: `${fontSize}px`,
                        fontWeight: 900,
                        color: isCurrentWord ? styleConfig.activeColor : styleConfig.inactiveColor,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        textShadow: isCurrentWord 
                          ? '0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4)'
                          : '2px 2px 4px rgba(0,0,0,0.8)',
                        transform: isCurrentWord ? 'scale(1.1)' : 'scale(1)',
                        display: 'inline-block',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {word.word}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};