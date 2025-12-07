import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
  onStartMusic: () => void;
  guestName?: string;
  showRSVPButton?: boolean;
  onRSVP?: () => void;
}

// ============================================
// CONFIGURATION - Adjust these values as needed
// ============================================
const TYPEWRITER_CONFIG = {
  soundUrl: '/media/typewriter.mp3',
  soundVolume: 1,            // 0 to 1 (base volume)
  soundGain: 1.2,            // Amplification multiplier (1 = normal, 2 = 2x louder)
  soundStartOffset: 1,       // seconds into the audio to start from
  soundPlaybackRate: 2,      // 0.5 = half speed, 1 = normal, 2 = double speed
  typingSpeed: 75,          // milliseconds between each character
};
// ============================================

const getScreens = (guestName?: string) => [
  {
    text: "Snow fell in quiet sheets over a hidden hacker house, tucked in a winter forest, its windows cutting warm light into the cold night...",
  },
  {
    text: "Inside, laptops slept on tables, lights were strung along the walls, and something rich simmered on the stove, wrapping every room in winter comfort...",
  },
  ...(guestName
    ? [
        {
          text: `Somewhere between the music and the clatter of pans, a place had already been set aside with {{${guestName}}}'s name on it...`,
        },
      ]
    : []),
];

// Parse text into segments: regular text and highlighted names
interface TextSegment {
  type: 'text' | 'highlight';
  content: string;
}

function parseTextWithHighlights(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'highlight', content: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

function TypewriterText({ text, onComplete, audioRef }: {
  text: string;
  onComplete: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [charIndex, setCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Parse segments once
  const segments = parseTextWithHighlights(text);
  // Calculate total length (without the {{ }} markers)
  const totalLength = segments.reduce((acc, seg) => acc + seg.content.length, 0);

  useEffect(() => {
    // Start the typewriter sound (audio is pre-unlocked by parent)
    if (audioRef.current) {
      audioRef.current.currentTime = TYPEWRITER_CONFIG.soundStartOffset;
      audioRef.current.play().catch(() => {
        // Audio autoplay blocked - that's okay
      });
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index < totalLength) {
        index++;
        setCharIndex(index);
      } else {
        clearInterval(timer);
        setIsComplete(true);
        // Stop the typewriter sound
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        onComplete();
      }
    }, TYPEWRITER_CONFIG.typingSpeed);

    return () => {
      clearInterval(timer);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [totalLength, onComplete]);

  // Render segments up to current character index
  const renderSegments = () => {
    let charsRemaining = charIndex;
    const result: React.ReactNode[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (charsRemaining <= 0) break;

      const charsToShow = Math.min(charsRemaining, segment.content.length);
      const displayText = segment.content.slice(0, charsToShow);
      charsRemaining -= charsToShow;

      if (segment.type === 'highlight') {
        result.push(
          <span
            key={i}
            className="text-gold font-semibold"
            style={{
              textShadow: '0 0 20px rgba(232, 185, 35, 0.6), 0 0 40px rgba(232, 185, 35, 0.3)',
            }}
          >
            {displayText}
          </span>
        );
      } else {
        result.push(<span key={i}>{displayText}</span>);
      }
    }

    return result;
  };

  return (
    <span className="inline">
      {renderSegments()}
      {!isComplete && (
        <span className="animate-pulse ml-0.5 inline-block w-[3px] h-[1.2em] bg-white align-middle" />
      )}
    </span>
  );
}

export function CinematicIntro({ onComplete, onStartMusic, guestName, showRSVPButton, onRSVP }: CinematicIntroProps) {
  const screens = getScreens(guestName);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [titleAnimationStage, setTitleAnimationStage] = useState(0);

  // Shared audio ref for typewriter sound - created once and unlocked on first tap
  const typewriterAudioRef = useRef<HTMLAudioElement | null>(null);

  // Unlock audio on mobile by playing/pausing the actual audio on first interaction
  const unlockAudio = () => {
    // Create and configure the typewriter audio
    const audio = new Audio(TYPEWRITER_CONFIG.soundUrl);
    audio.volume = TYPEWRITER_CONFIG.soundVolume;
    audio.playbackRate = TYPEWRITER_CONFIG.soundPlaybackRate;
    audio.loop = true;
    audio.preload = 'auto';
    typewriterAudioRef.current = audio;

    // Use Web Audio API for amplification beyond 1.0
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = TYPEWRITER_CONFIG.soundGain;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
    } catch {
      // If Web Audio API fails, fall back to normal volume
    }

    // Play and immediately pause to unlock audio on mobile
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = TYPEWRITER_CONFIG.soundStartOffset;
    }).catch(() => {
      // If play fails, still keep the audio reference
    });

    // Also unlock all audio elements on the page (for the music player)
    // This enables playback of audio that will be triggered later
    document.querySelectorAll('audio').forEach((audioEl) => {
      const promise = audioEl.play();
      if (promise) {
        promise.then(() => {
          audioEl.pause();
        }).catch(() => {
          // Ignore errors
        });
      }
    });
  };

  const handleStart = () => {
    unlockAudio();
    setHasStarted(true);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (typewriterAudioRef.current) {
        typewriterAudioRef.current.pause();
        typewriterAudioRef.current = null;
      }
    };
  }, []);

  // Dev shortcut: Press Enter to skip intro (skips to title screen without starting music)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!hasStarted) {
          unlockAudio();
          setHasStarted(true);
        }
        // Don't start music here - it starts when user clicks RSVP/Continue button
        setShowTitle(true);
        // Trigger title animation stages
        setTimeout(() => setTitleAnimationStage(1), 100);
        setTimeout(() => setTitleAnimationStage(2), 600);
        setTimeout(() => setTitleAnimationStage(3), 1200);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete, hasStarted]);

  const handleTypingComplete = useCallback(() => {
    setIsTypingComplete(true);
  }, []);

  const handleContinue = () => {
    if (!isTypingComplete) return;

    setIsFadingOut(true);

    setTimeout(() => {
      if (currentScreen < screens.length - 1) {
        setCurrentScreen(prev => prev + 1);
        setIsTypingComplete(false);
        setIsFadingOut(false);
      } else {
        // Show title screen
        setShowTitle(true);
        setIsFadingOut(false);
        // Animate title in stages - music starts when button is clicked, not here
        setTimeout(() => setTitleAnimationStage(1), 100);
        setTimeout(() => setTitleAnimationStage(2), 600);
        setTimeout(() => setTitleAnimationStage(3), 1200);
      }
    }, 500);
  };

  const handleFinalContinue = () => {
    onStartMusic(); // Start music when user clicks the RSVP/Continue button
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  const handleRSVPClick = () => {
    onStartMusic(); // Start music when user clicks the RSVP button
    if (onRSVP) {
      onRSVP();
    }
  };

  // "Tap to begin" screen - required for mobile audio unlock
  if (!hasStarted) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center cursor-pointer"
        style={{ minHeight: '100dvh' }}
        onClick={handleStart}
      >
        {/* Subtle starfield */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[1px] h-[1px] bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-6">
          <div className="text-4xl sm:text-6xl mb-6 animate-pulse">✨</div>
          <p className="text-white/80 text-lg sm:text-2xl font-display mb-8">
            Welcome
          </p>
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm sm:text-base animate-pulse">
            <span>Tap anywhere to begin</span>
          </div>
        </div>
      </div>
    );
  }

  if (showTitle) {
    return (
      <div
        className={`fixed inset-0 z-[9999] bg-gradient-to-b from-[#0a0a0a] via-[#1a0a0a] to-black flex flex-col items-center justify-center transition-opacity duration-700 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
        style={{ minHeight: '100dvh' }}
      >
        {/* Starfield background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[2px] h-[2px] bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>

        {/* Multiple glowing layers for depth */}
        <div
          className={`absolute inset-0 transition-opacity duration-[2000ms] ${titleAnimationStage >= 1 ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(ellipse at center, rgba(166, 61, 64, 0.4) 0%, transparent 50%)' }}
        />
        <div
          className={`absolute inset-0 transition-opacity duration-[2000ms] delay-500 ${titleAnimationStage >= 1 ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(ellipse at center, rgba(232, 185, 35, 0.15) 0%, transparent 40%)' }}
        />
        <div
          className={`absolute inset-0 transition-opacity duration-[2000ms] ${titleAnimationStage >= 2 ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(30, 86, 49, 0.2) 0%, transparent 50%)' }}
        />

        {/* Animated glow pulse */}
        <div
          className={`absolute inset-0 animate-pulse transition-opacity duration-[2000ms] ${titleAnimationStage >= 2 ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(232, 185, 35, 0.1) 0%, transparent 60%)',
            animationDuration: '3s'
          }}
        />

        {/* Title - positioned in center with flex */}
        <div className={`relative z-10 text-center px-6 sm:px-8 max-w-lg sm:max-w-2xl transition-all duration-[2500ms] ${titleAnimationStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          {/* Glow behind title */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cranberry/30 via-gold/20 to-cranberry/30 -z-10 scale-150" />

          <h1 className={`text-3xl sm:text-5xl md:text-7xl font-display text-transparent bg-clip-text bg-gradient-to-b from-gold via-cream to-gold tracking-wider transition-all duration-1500 ${titleAnimationStage >= 2 ? 'tracking-[0.05em] sm:tracking-[0.15em]' : ''}`}
            style={{
              textShadow: '0 0 40px rgba(232, 185, 35, 0.5), 0 0 80px rgba(232, 185, 35, 0.3), 0 0 120px rgba(232, 185, 35, 0.2)',
              filter: 'drop-shadow(0 0 30px rgba(232, 185, 35, 0.5))'
            }}>
            Atmosphere
          </h1>
          <h2 className={`text-lg sm:text-3xl md:text-5xl font-display text-snow mt-1 sm:mt-2 transition-all duration-1500 delay-500 ${titleAnimationStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)' }}>
            {showRSVPButton ? 'Holiday Feast' : 'Holiday Feast Planner'}
          </h2>

          {/* Decorative line with glow */}
          <div className={`mx-auto mt-3 sm:mt-6 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent transition-all duration-1200 ${titleAnimationStage >= 2 ? 'w-32 sm:w-64 opacity-100' : 'w-0 opacity-0'}`}
            style={{ boxShadow: '0 0 20px rgba(232, 185, 35, 0.6), 0 0 40px rgba(232, 185, 35, 0.3)' }} />

          {/* Tagline */}
          <p className={`text-gold/80 mt-2 sm:mt-4 text-xs sm:text-lg italic transition-all duration-1000 ${titleAnimationStage >= 3 ? 'opacity-100' : 'opacity-0'}`}
            style={{ textShadow: '0 0 10px rgba(232, 185, 35, 0.3)' }}>
            {showRSVPButton ? `${guestName}, you're invited! 🎄` : '✨ Plan the perfect holiday gathering ✨'}
          </p>
        </div>

        {/* Continue/RSVP button with glow - use margin-top instead of absolute positioning */}
        <button
          onClick={showRSVPButton && onRSVP ? handleRSVPClick : handleFinalContinue}
          className={`relative z-10 mt-8 sm:mt-12 flex items-center gap-2 text-snow/90 text-sm sm:text-lg font-medium px-5 sm:px-8 py-2 sm:py-3 rounded-full border-2 border-gold/40 bg-gradient-to-r from-cranberry/20 to-holly/20 backdrop-blur-sm hover:from-cranberry/30 hover:to-holly/30 hover:border-gold/60 active:from-cranberry/40 active:to-holly/40 hover:scale-105 transition-all duration-500 ${titleAnimationStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ boxShadow: '0 0 30px rgba(232, 185, 35, 0.2), inset 0 0 20px rgba(232, 185, 35, 0.1)' }}
        >
          {showRSVPButton ? (
            <>🎉 I'm Coming (RSVP)!</>
          ) : (
            <>Begin Your Journey <ChevronRight size={18} className="sm:w-5 sm:h-5" /></>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ minHeight: '100dvh' }}
    >
      {/* Subtle starfield */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[1px] h-[1px] bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Text container */}
      <div className="relative z-10 max-w-lg sm:max-w-3xl mx-auto px-6 sm:px-8 text-center">
        <p className="text-white text-base sm:text-2xl md:text-4xl font-display leading-relaxed tracking-wide">
          <TypewriterText
            text={screens[currentScreen].text}
            onComplete={handleTypingComplete}
            audioRef={typewriterAudioRef}
          />
        </p>
      </div>

      {/* Continue button - use margin instead of absolute for mobile */}
      <button
        onClick={handleContinue}
        disabled={!isTypingComplete || isFadingOut}
        className={`relative z-10 mt-8 sm:mt-12 flex items-center gap-2 text-white/80 text-sm sm:text-base font-medium px-5 sm:px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-500 ${
          isTypingComplete && !isFadingOut
            ? 'opacity-100 translate-y-0 hover:bg-white/10 hover:border-white/40 active:bg-white/20 cursor-pointer'
            : 'opacity-0 translate-y-4 cursor-default'
        }`}
      >
        Continue <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  );
}

