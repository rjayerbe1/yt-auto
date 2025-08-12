import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  startFrame: number;
  endFrame: number;
}

interface Segment {
  text: string;
  audioFile: string;
  duration: number;
  startTime: number;
  endTime: number;
  wordTimings?: WordTiming[];
}

interface DebugSubtitlesProps {
  title: string;
  segments: Segment[];
  totalDuration: number;
  videoStyle?: number;
}

export const DebugSubtitles: React.FC<DebugSubtitlesProps> = ({
  title,
  segments,
  totalDuration,
  videoStyle = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Collect all words
  const allWords: WordTiming[] = [];
  segments.forEach(segment => {
    if (segment.wordTimings) {
      allWords.push(...segment.wordTimings);
    }
  });

  // Find current word
  let currentWord = null;
  let currentIndex = -1;
  for (let i = 0; i < allWords.length; i++) {
    if (currentTime >= allWords[i].startTime && currentTime < allWords[i].endTime) {
      currentWord = allWords[i];
      currentIndex = i;
      break;
    }
  }

  return (
    <div style={{
      background: 'black',
      width: '100%',
      height: '100%',
      color: 'white',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '16px',
    }}>
      <h2>Debug Subtitles</h2>
      <div>
        <p>Frame: {frame}</p>
        <p>Time: {currentTime.toFixed(2)}s</p>
        <p>Total Words: {allWords.length}</p>
        <p>Current Index: {currentIndex}</p>
        <p>Current Word: {currentWord ? `"${currentWord.word}"` : 'None'}</p>
        <p>Video Style: {videoStyle}</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>All Words:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {allWords.map((word, idx) => (
            <div
              key={idx}
              style={{
                padding: '5px',
                background: idx === currentIndex ? 'green' : 'gray',
                borderRadius: '3px',
              }}
            >
              {word.word}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Word Timings (first 10):</h3>
        {allWords.slice(0, 10).map((word, idx) => (
          <div key={idx}>
            {idx}: "{word.word}" @ {word.startTime.toFixed(2)}s - {word.endTime.toFixed(2)}s
          </div>
        ))}
      </div>
    </div>
  );
};