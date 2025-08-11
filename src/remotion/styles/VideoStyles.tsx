import React from 'react';
import { interpolate, spring } from 'remotion';

// Type definitions
interface StyleProps {
  currentWord: { word: string; startTime: number; endTime: number } | null;
  frame: number;
  fps: number;
  wordAnimation: { scale: number; opacity: number };
}

// STYLE 1: Karaoke Bottom Bar
export const KaraokeBottomBar: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    bottom: '100px',
    width: '100%',
    textAlign: 'center',
    background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))',
    padding: '40px 20px',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '60px',
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        opacity: wordAnimation.opacity,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 2: TikTok Style (Big & Bold)
export const TikTokStyle: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        textTransform: 'uppercase',
        WebkitTextStroke: '3px black',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 3: Neon Glow
export const NeonGlow: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '90px',
        fontWeight: 'bold',
        color: '#00ffff',
        textShadow: `
          0 0 10px #00ffff,
          0 0 20px #00ffff,
          0 0 30px #00ffff,
          0 0 40px #00ffff
        `,
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 4: Typewriter Effect
export const TypewriterEffect: React.FC<StyleProps> = ({ currentWord, frame, fps }) => {
  const progress = currentWord ? (frame % 10) / 10 : 0;
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: 'Courier New, monospace',
    }}>
      {currentWord && (
        <div style={{
          fontSize: '70px',
          color: '#00FF00',
          background: '#000000',
          padding: '20px',
          border: '2px solid #00FF00',
        }}>
          {currentWord.word}
          <span style={{ opacity: progress > 0.5 ? 1 : 0 }}>_</span>
        </div>
      )}
    </div>
  );
};

// STYLE 5: Comic Book Style
export const ComicBookStyle: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-5deg)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '120px',
        fontWeight: '900',
        color: '#FF0000',
        background: '#FFFF00',
        padding: '20px 40px',
        border: '5px solid #000000',
        fontFamily: 'Comic Sans MS, cursive',
        textTransform: 'uppercase',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
        boxShadow: '10px 10px 0px #000000',
      }}>
        {currentWord.word}!
      </div>
    )}
  </div>
);

// STYLE 6: Minimalist
export const Minimalist: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '48px',
        fontWeight: '300',
        color: '#333333',
        fontFamily: 'Helvetica Neue, sans-serif',
        opacity: wordAnimation.opacity,
        letterSpacing: '8px',
      }}>
        {currentWord.word.toLowerCase()}
      </div>
    )}
  </div>
);

// STYLE 7: Instagram Stories Style
export const InstagramStories: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '30%',
    width: '100%',
    textAlign: 'center',
  }}>
    {currentWord && (
      <div style={{
        display: 'inline-block',
        fontSize: '80px',
        fontWeight: 'bold',
        color: '#FFFFFF',
        background: 'linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)',
        padding: '15px 30px',
        borderRadius: '15px',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 8: YouTube Subtitle Style
export const YouTubeSubtitle: React.FC<StyleProps> = ({ currentWord }) => (
  <div style={{
    position: 'absolute',
    bottom: '60px',
    width: '100%',
    textAlign: 'center',
  }}>
    {currentWord && (
      <div style={{
        display: 'inline-block',
        fontSize: '42px',
        color: '#FFFFFF',
        background: 'rgba(0,0,0,0.75)',
        padding: '8px 20px',
        fontFamily: 'Roboto, sans-serif',
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 9: Glitch Effect
export const GlitchEffect: React.FC<StyleProps> = ({ currentWord, frame }) => {
  const glitch = (frame % 30) < 2;
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      {currentWord && (
        <>
          <div style={{
            fontSize: '100px',
            fontWeight: 'bold',
            color: glitch ? '#FF00FF' : '#FFFFFF',
            position: 'absolute',
            transform: glitch ? 'translateX(-2px)' : 'none',
          }}>
            {currentWord.word}
          </div>
          <div style={{
            fontSize: '100px',
            fontWeight: 'bold',
            color: glitch ? '#00FFFF' : 'transparent',
            position: 'absolute',
            transform: glitch ? 'translateX(2px)' : 'none',
          }}>
            {currentWord.word}
          </div>
        </>
      )}
    </div>
  );
};

// STYLE 10: Bouncing Letters
export const BouncingLetters: React.FC<StyleProps> = ({ currentWord, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{ display: 'flex', gap: '5px' }}>
        {currentWord.word.split('').map((letter, i) => (
          <span
            key={i}
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#FFD700',
              transform: `translateY(${Math.sin((frame + i * 10) * 0.1) * 20}px)`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 11: Gradient Text
export const GradientText: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        background: 'linear-gradient(45deg, #f093fb, #f5576c)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 12: 3D Shadow
export const Shadow3D: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        color: '#FFFFFF',
        textShadow: `
          1px 1px 0 #000,
          2px 2px 0 #000,
          3px 3px 0 #000,
          4px 4px 0 #000,
          5px 5px 0 #000,
          6px 6px 10px rgba(0,0,0,0.5)
        `,
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 13: Outline Only
export const OutlineOnly: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '120px',
        fontWeight: '900',
        color: 'transparent',
        WebkitTextStroke: '4px #FFFFFF',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 14: Retro Wave
export const RetroWave: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '90px',
        fontWeight: 'bold',
        fontFamily: 'Impact, sans-serif',
        color: '#FF00FF',
        textShadow: `
          0 0 10px #FF00FF,
          0 0 20px #00FFFF,
          0 0 30px #FF00FF
        `,
        fontStyle: 'italic',
        opacity: wordAnimation.opacity,
        transform: `perspective(300px) rotateY(15deg) scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 15: Bubble Style
export const BubbleStyle: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '70px',
        fontWeight: 'bold',
        color: '#FFFFFF',
        background: '#4A90E2',
        padding: '30px 50px',
        borderRadius: '50px',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 16: Split Color
export const SplitColor: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        background: 'linear-gradient(90deg, #FF0000 50%, #0000FF 50%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 17: Matrix Style
export const MatrixStyle: React.FC<StyleProps> = ({ currentWord }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#000000',
    padding: '40px',
    border: '2px solid #00FF00',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '60px',
        fontFamily: 'monospace',
        color: '#00FF00',
        textShadow: '0 0 10px #00FF00',
      }}>
        [{currentWord.word.toUpperCase()}]
      </div>
    )}
  </div>
);

// STYLE 18: Handwritten Style
export const HandwrittenStyle: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-2deg)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '80px',
        fontFamily: 'Brush Script MT, cursive',
        color: '#2C3E50',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 19: Fire Text
export const FireText: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        background: 'linear-gradient(45deg, #FF0000, #FF6600, #FFFF00)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 20px rgba(255,100,0,0.5)',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 20: Ice/Frozen Text
export const IceText: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        background: 'linear-gradient(45deg, #00FFFF, #0099FF, #FFFFFF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 30px rgba(0,200,255,0.5)',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 21: Stamp Effect
export const StampEffect: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-15deg)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '90px',
        fontWeight: '900',
        color: '#FF0000',
        border: '8px solid #FF0000',
        padding: '20px 40px',
        textTransform: 'uppercase',
        opacity: wordAnimation.opacity * 0.8,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 22: Pixelated
export const PixelatedStyle: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '80px',
        fontFamily: '"Courier New", monospace',
        color: '#00FF00',
        imageRendering: 'pixelated',
        letterSpacing: '4px',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word.toUpperCase()}
      </div>
    )}
  </div>
);

// STYLE 23: Metallic Shine
export const MetallicShine: React.FC<StyleProps> = ({ currentWord, wordAnimation, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        background: `linear-gradient(${45 + frame}deg, #C0C0C0, #FFFFFF, #C0C0C0)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 24: Rainbow Animation
export const RainbowAnimation: React.FC<StyleProps> = ({ currentWord, wordAnimation, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        color: `hsl(${(frame * 10) % 360}, 100%, 50%)`,
        textShadow: '0 0 20px currentColor',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 25: Newspaper Headline
export const NewspaperHeadline: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        fontFamily: 'Georgia, serif',
        color: '#000000',
        textTransform: 'uppercase',
        borderTop: '5px solid #000000',
        borderBottom: '5px solid #000000',
        padding: '20px 0',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 26: Emoji Background
export const EmojiBackground: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <>
        <div style={{
          position: 'absolute',
          fontSize: '200px',
          opacity: 0.3,
          transform: 'translate(-50%, -50%)',
        }}>
          🔥
        </div>
        <div style={{
          fontSize: '80px',
          fontWeight: '900',
          color: '#FFFFFF',
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          opacity: wordAnimation.opacity,
          transform: `scale(${wordAnimation.scale})`,
          position: 'relative',
        }}>
          {currentWord.word}
        </div>
      </>
    )}
  </div>
);

// STYLE 27: Graffiti Style
export const GraffitiStyle: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-8deg)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '110px',
        fontWeight: '900',
        color: '#FF00FF',
        WebkitTextStroke: '4px #000000',
        textShadow: `
          4px 4px 0 #00FFFF,
          8px 8px 0 #FFFF00,
          12px 12px 10px rgba(0,0,0,0.3)
        `,
        fontFamily: 'Impact, sans-serif',
        textTransform: 'uppercase',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 28: Glassmorphism
export const Glassmorphism: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '80px',
        fontWeight: 'bold',
        color: '#FFFFFF',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '30px 50px',
        opacity: wordAnimation.opacity,
        transform: `scale(${wordAnimation.scale})`,
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);

// STYLE 29: Spotlight Effect
export const SpotlightEffect: React.FC<StyleProps> = ({ currentWord, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }}>
    {currentWord && (
      <>
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }} />
        <div style={{
          fontSize: '90px',
          fontWeight: '900',
          color: '#FFFFFF',
          textShadow: '0 0 40px rgba(255,255,255,0.8)',
          opacity: wordAnimation.opacity,
          transform: `scale(${wordAnimation.scale})`,
          position: 'relative',
        }}>
          {currentWord.word}
        </div>
      </>
    )}
  </div>
);

// STYLE 30: Rotating 3D
export const Rotating3D: React.FC<StyleProps> = ({ currentWord, wordAnimation, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    perspective: '1000px',
  }}>
    {currentWord && (
      <div style={{
        fontSize: '100px',
        fontWeight: '900',
        color: '#FFD700',
        textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
        opacity: wordAnimation.opacity,
        transform: `rotateY(${frame * 2}deg) scale(${wordAnimation.scale})`,
        transformStyle: 'preserve-3d',
      }}>
        {currentWord.word}
      </div>
    )}
  </div>
);