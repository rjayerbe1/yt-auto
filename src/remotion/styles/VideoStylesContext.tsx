import React from 'react';
import { interpolate, spring } from 'remotion';

// Type definitions
interface ContextWord {
  word: string;
  isActive: boolean;
  opacity: number;
}

interface Context {
  words: ContextWord[];
  currentWord: { word: string; startTime: number; endTime: number };
  fullPhrase: string;
  segmentWords: any[];
  currentIndex: number;
}

interface StyleProps {
  context: Context | null;
  frame: number;
  fps: number;
  wordAnimation: { scale: number; opacity: number };
}

// STYLE 1: Karaoke Bottom Bar - Shows full phrase with highlight
export const KaraokeBottomBar: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    bottom: '100px',
    width: '100%',
    textAlign: 'center',
    background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))',
    padding: '40px 20px',
  }}>
    {context && (
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
        maxWidth: '90%',
        margin: '0 auto',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FFD700' : '#FFFFFF',
              opacity: word.isActive ? 1 : word.opacity,
              textShadow: word.isActive 
                ? '0 0 20px rgba(255,215,0,0.8), 2px 2px 4px rgba(0,0,0,0.8)' 
                : '2px 2px 4px rgba(0,0,0,0.8)',
              transform: word.isActive ? `scale(${wordAnimation.scale * 1.2})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 2: TikTok Style - Context with big active word
export const TikTokStyle: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
  }}>
    {context && (
      <div style={{
        fontSize: '60px',
        fontWeight: '900',
        textAlign: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: '#FFFFFF',
              fontSize: word.isActive ? '80px' : '60px',
              WebkitTextStroke: word.isActive ? '4px black' : '2px black',
              opacity: word.isActive ? 1 : word.opacity * 0.7,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            {word.word.toUpperCase()}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 3: Neon Glow - Context with neon active word
export const NeonGlow: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: 'bold',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#00ffff' : '#ffffff',
              textShadow: word.isActive 
                ? `0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff`
                : 'none',
              opacity: word.isActive ? 1 : word.opacity * 0.6,
              transform: word.isActive ? `scale(${wordAnimation.scale * 1.1})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 4: Typewriter Effect - Shows like typing with cursor
export const TypewriterEffect: React.FC<StyleProps> = ({ context, frame }) => {
  const cursorBlink = (frame % 20) < 10;
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: 'Courier New, monospace',
      width: '85%',
    }}>
      {context && (
        <div style={{
          fontSize: '48px',
          color: '#00FF00',
          background: '#000000',
          padding: '30px',
          border: '2px solid #00FF00',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {context.words.map((word, idx) => (
            <span
              key={idx}
              style={{
                opacity: word.isActive ? 1 : word.opacity * 0.5,
                color: word.isActive ? '#00FF00' : '#008800',
              }}
            >
              {word.word}
              {word.isActive && <span style={{ opacity: cursorBlink ? 1 : 0 }}>_</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// STYLE 5: Comic Book Style - Speech bubble with context
export const ComicBookStyle: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-2deg)',
  }}>
    {context && (
      <div style={{
        fontSize: '52px',
        fontWeight: '900',
        background: '#FFFF00',
        padding: '30px 50px',
        border: '5px solid #000000',
        fontFamily: 'Comic Sans MS, cursive',
        boxShadow: '10px 10px 0px #000000',
        maxWidth: '800px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FF0000' : '#000000',
              transform: word.isActive ? `scale(${wordAnimation.scale * 1.3})` : 'scale(1)',
              textTransform: 'uppercase',
              opacity: word.isActive ? 1 : word.opacity * 0.7,
              transition: 'all 0.15s ease',
            }}
          >
            {word.word}
            {word.isActive && '!'}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 6: Minimalist - Clean context display
export const Minimalist: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
  }}>
    {context && (
      <div style={{
        fontSize: '42px',
        fontWeight: '300',
        fontFamily: 'Helvetica Neue, sans-serif',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#000000' : '#999999',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              fontWeight: word.isActive ? '600' : '300',
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.3s ease',
              letterSpacing: word.isActive ? '4px' : '2px',
            }}
          >
            {word.word.toLowerCase()}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 7: Instagram Stories Style
export const InstagramStories: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '30%',
    width: '100%',
    textAlign: 'center',
  }}>
    {context && (
      <div style={{
        display: 'inline-block',
        background: 'linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)',
        padding: '20px 40px',
        borderRadius: '20px',
        maxWidth: '85%',
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
        }}>
          {context.words.map((word, idx) => (
            <span
              key={idx}
              style={{
                opacity: word.isActive ? 1 : word.opacity * 0.7,
                transform: word.isActive ? `scale(${wordAnimation.scale * 1.1})` : 'scale(1)',
                textShadow: word.isActive ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {word.word}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// STYLE 8: YouTube Subtitle Style - Traditional subtitles with highlight
export const YouTubeSubtitle: React.FC<StyleProps> = ({ context }) => (
  <div style={{
    position: 'absolute',
    bottom: '60px',
    width: '100%',
    textAlign: 'center',
  }}>
    {context && (
      <div style={{
        display: 'inline-block',
        background: 'rgba(0,0,0,0.75)',
        padding: '12px 24px',
        maxWidth: '90%',
      }}>
        <div style={{
          fontSize: '36px',
          fontFamily: 'Roboto, sans-serif',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '6px',
        }}>
          {context.words.map((word, idx) => (
            <span
              key={idx}
              style={{
                color: word.isActive ? '#FFFF00' : '#FFFFFF',
                fontWeight: word.isActive ? 'bold' : 'normal',
                opacity: word.isActive ? 1 : word.opacity * 0.9,
              }}
            >
              {word.word}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// STYLE 9: Glitch Effect - Context with glitch on active
export const GlitchEffect: React.FC<StyleProps> = ({ context, frame }) => {
  const glitch = (frame % 30) < 2;
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '85%',
    }}>
      {context && (
        <div style={{
          fontSize: '56px',
          fontWeight: 'bold',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
        }}>
          {context.words.map((word, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <span style={{
                color: word.isActive && glitch ? '#FF00FF' : '#FFFFFF',
                opacity: word.isActive ? 1 : word.opacity * 0.6,
                transform: word.isActive && glitch ? 'translateX(-2px)' : 'none',
              }}>
                {word.word}
              </span>
              {word.isActive && glitch && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  color: '#00FFFF',
                  transform: 'translateX(2px)',
                }}>
                  {word.word}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// STYLE 10: Bouncing Letters - Context with bouncing active word
export const BouncingLetters: React.FC<StyleProps> = ({ context, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '52px',
        fontWeight: 'bold',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FFD700' : '#FFFFFF',
              opacity: word.isActive ? 1 : word.opacity * 0.6,
              transform: word.isActive 
                ? `translateY(${Math.sin(frame * 0.3) * 15}px)` 
                : 'translateY(0)',
              transition: word.isActive ? 'none' : 'all 0.3s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// Continue with the rest of the styles...
// STYLE 11: Gradient Text
export const GradientText: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '54px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              background: word.isActive 
                ? 'linear-gradient(45deg, #f093fb, #f5576c)' 
                : 'linear-gradient(45deg, #666, #999)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale * 1.2})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 12: 3D Shadow
export const Shadow3D: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: '#FFFFFF',
              textShadow: word.isActive 
                ? `1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000, 4px 4px 0 #000, 5px 5px 0 #000, 6px 6px 10px rgba(0,0,0,0.5)`
                : '2px 2px 4px rgba(0,0,0,0.3)',
              opacity: word.isActive ? 1 : word.opacity * 0.6,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 13: Outline Only
export const OutlineOnly: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '60px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FFFFFF' : 'transparent',
              WebkitTextStroke: word.isActive ? '4px #FFFFFF' : '2px #666666',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 14: Retro Wave
export const RetroWave: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '52px',
        fontWeight: 'bold',
        fontFamily: 'Impact, sans-serif',
        fontStyle: 'italic',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FF00FF' : '#00FFFF',
              textShadow: word.isActive 
                ? `0 0 10px #FF00FF, 0 0 20px #00FFFF, 0 0 30px #FF00FF`
                : '0 0 5px currentColor',
              opacity: word.isActive ? 1 : word.opacity * 0.6,
              transform: word.isActive 
                ? `perspective(300px) rotateY(15deg) scale(${wordAnimation.scale})` 
                : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 15: Bubble Style
export const BubbleStyle: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '15px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              fontSize: word.isActive ? '52px' : '44px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              background: word.isActive ? '#4A90E2' : '#7B68EE',
              padding: '15px 25px',
              borderRadius: '30px',
              opacity: word.isActive ? 1 : word.opacity * 0.6,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              boxShadow: word.isActive 
                ? '0 10px 30px rgba(0,0,0,0.4)' 
                : '0 5px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// Continue with remaining styles (16-30)...
// STYLE 16: Split Color
export const SplitColor: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              background: word.isActive 
                ? 'linear-gradient(90deg, #FF0000 50%, #0000FF 50%)' 
                : 'linear-gradient(90deg, #666 50%, #999 50%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 17: Matrix Style
export const MatrixStyle: React.FC<StyleProps> = ({ context }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#000000',
    padding: '40px',
    border: '2px solid #00FF00',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '42px',
        fontFamily: 'monospace',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#00FF00' : '#008800',
              textShadow: word.isActive ? '0 0 10px #00FF00' : 'none',
              opacity: word.isActive ? 1 : word.opacity * 0.4,
            }}
          >
            {word.isActive ? `[${word.word.toUpperCase()}]` : word.word.toUpperCase()}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 18: Handwritten Style
export const HandwrittenStyle: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-1deg)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '48px',
        fontFamily: 'Brush Script MT, cursive',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#2C3E50' : '#95A5A6',
              opacity: word.isActive ? 1 : word.opacity * 0.6,
              transform: word.isActive 
                ? `scale(${wordAnimation.scale}) rotate(${Math.sin(idx) * 2}deg)` 
                : `rotate(${Math.sin(idx) * 1}deg)`,
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 19: Fire Text
export const FireText: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              background: word.isActive 
                ? 'linear-gradient(45deg, #FF0000, #FF6600, #FFFF00)' 
                : 'linear-gradient(45deg, #800000, #A0522D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: word.isActive ? '0 0 20px rgba(255,100,0,0.5)' : 'none',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 20: Ice/Frozen Text
export const IceText: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              background: word.isActive 
                ? 'linear-gradient(45deg, #00FFFF, #0099FF, #FFFFFF)' 
                : 'linear-gradient(45deg, #E0F7FA, #B2EBF2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: word.isActive ? '0 0 30px rgba(0,200,255,0.5)' : 'none',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 21: Stamp Effect
export const StampEffect: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-10deg)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '52px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FF0000' : '#8B0000',
              border: word.isActive ? '4px solid #FF0000' : '2px solid #8B0000',
              padding: word.isActive ? '10px 20px' : '5px 10px',
              textTransform: 'uppercase',
              opacity: word.isActive ? 0.9 : word.opacity * 0.4,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 22: Pixelated
export const PixelatedStyle: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '48px',
        fontFamily: '"Courier New", monospace',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#00FF00' : '#008800',
              imageRendering: 'pixelated',
              letterSpacing: word.isActive ? '6px' : '3px',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word.toUpperCase()}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 23: Metallic Shine
export const MetallicShine: React.FC<StyleProps> = ({ context, wordAnimation, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              background: word.isActive 
                ? `linear-gradient(${45 + frame}deg, #C0C0C0, #FFFFFF, #C0C0C0)` 
                : 'linear-gradient(45deg, #808080, #A9A9A9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 24: Rainbow Animation
export const RainbowAnimation: React.FC<StyleProps> = ({ context, wordAnimation, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive 
                ? `hsl(${(frame * 10) % 360}, 100%, 50%)` 
                : '#FFFFFF',
              textShadow: word.isActive ? '0 0 20px currentColor' : 'none',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 25: Newspaper Headline
export const NewspaperHeadline: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        borderTop: '5px solid #000000',
        borderBottom: '5px solid #000000',
        padding: '30px 0',
      }}>
        <div style={{
          fontSize: '52px',
          fontWeight: '900',
          fontFamily: 'Georgia, serif',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
        }}>
          {context.words.map((word, idx) => (
            <span
              key={idx}
              style={{
                color: word.isActive ? '#000000' : '#666666',
                textTransform: 'uppercase',
                opacity: word.isActive ? 1 : word.opacity * 0.5,
                transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              {word.word}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// STYLE 26: Emoji Background
export const EmojiBackground: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <>
        <div style={{
          position: 'absolute',
          fontSize: '200px',
          opacity: 0.3,
          transform: 'translate(-50%, -50%)',
          top: '50%',
          left: '50%',
        }}>
          🔥
        </div>
        <div style={{
          fontSize: '52px',
          fontWeight: '900',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          position: 'relative',
        }}>
          {context.words.map((word, idx) => (
            <span
              key={idx}
              style={{
                color: '#FFFFFF',
                textShadow: word.isActive 
                  ? '3px 3px 6px rgba(0,0,0,0.8)' 
                  : '2px 2px 4px rgba(0,0,0,0.6)',
                opacity: word.isActive ? 1 : word.opacity * 0.7,
                transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              {word.word}
            </span>
          ))}
        </div>
      </>
    )}
  </div>
);

// STYLE 27: Graffiti Style
export const GraffitiStyle: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-5deg)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '60px',
        fontWeight: '900',
        fontFamily: 'Impact, sans-serif',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FF00FF' : '#FFFFFF',
              WebkitTextStroke: word.isActive ? '4px #000000' : '2px #000000',
              textShadow: word.isActive 
                ? `4px 4px 0 #00FFFF, 8px 8px 0 #FFFF00, 12px 12px 10px rgba(0,0,0,0.3)`
                : 'none',
              textTransform: 'uppercase',
              opacity: word.isActive ? 1 : word.opacity * 0.6,
              transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);

// STYLE 28: Glassmorphism
export const Glassmorphism: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '40px',
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
        }}>
          {context.words.map((word, idx) => (
            <span
              key={idx}
              style={{
                color: word.isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                textShadow: word.isActive ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                opacity: word.isActive ? 1 : word.opacity * 0.7,
                transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              {word.word}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

// STYLE 29: Spotlight Effect
export const SpotlightEffect: React.FC<StyleProps> = ({ context, wordAnimation }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
  }}>
    {context && (
      <>
        {context.words.find(w => w.isActive) && (
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            top: '50%',
            left: '50%',
            pointerEvents: 'none',
          }} />
        )}
        <div style={{
          fontSize: '52px',
          fontWeight: '900',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          position: 'relative',
        }}>
          {context.words.map((word, idx) => (
            <span
              key={idx}
              style={{
                color: '#FFFFFF',
                textShadow: word.isActive 
                  ? '0 0 40px rgba(255,255,255,0.8)' 
                  : '0 0 10px rgba(255,255,255,0.2)',
                opacity: word.isActive ? 1 : word.opacity * 0.3,
                transform: word.isActive ? `scale(${wordAnimation.scale})` : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              {word.word}
            </span>
          ))}
        </div>
      </>
    )}
  </div>
);

// STYLE 30: Rotating 3D
export const Rotating3D: React.FC<StyleProps> = ({ context, wordAnimation, frame }) => (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    perspective: '1000px',
    width: '85%',
  }}>
    {context && (
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        transformStyle: 'preserve-3d',
      }}>
        {context.words.map((word, idx) => (
          <span
            key={idx}
            style={{
              color: word.isActive ? '#FFD700' : '#FFFFFF',
              textShadow: word.isActive ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none',
              opacity: word.isActive ? 1 : word.opacity * 0.5,
              transform: word.isActive 
                ? `rotateY(${frame * 2}deg) scale(${wordAnimation.scale})` 
                : 'rotateY(0deg) scale(1)',
              transformStyle: 'preserve-3d',
              transition: word.isActive ? 'none' : 'all 0.3s ease',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    )}
  </div>
);