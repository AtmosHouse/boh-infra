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
  soundPlaybackRate: 1,      // 0.5 = half speed, 1 = normal, 2 = double speed
  typingSpeed: 60,           // milliseconds between each character
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
  const [charIndex, setCharIndex] = useState(-1); // Start at -1 to prevent flash
  const [isComplete, setIsComplete] = useState(false);

  // Parse segments once
  const segments = parseTextWithHighlights(text);
  // Calculate total length (without the {{ }} markers)
  const totalLength = segments.reduce((acc, seg) => acc + seg.content.length, 0);

  useEffect(() => {
    // Start from 0 on next frame to prevent flash
    setCharIndex(0);

    // Resume the typewriter sound if it exists and is paused
    const tryPlayAudio = () => {
      if (audioRef.current && audioRef.current.paused) {
        // Don't reset currentTime - just resume from where it was
        audioRef.current.play().catch(() => {
          // Audio autoplay blocked - that's okay, typing will still work
        });
      }
    };

    // If audio ref exists, try to resume it
    if (audioRef.current) {
      tryPlayAudio();
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index < totalLength) {
        index++;
        setCharIndex(index);
      } else {
        clearInterval(timer);
        setIsComplete(true);
        // Pause the typewriter sound (don't reset currentTime)
        if (audioRef.current) {
          audioRef.current.pause();
        }
        onComplete();
      }
    }, TYPEWRITER_CONFIG.typingSpeed);

    return () => {
      clearInterval(timer);
      // Pause audio when component unmounts (screen changes)
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [totalLength, onComplete, audioRef]);

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
//  filter: brightness(10);
 // backdrop-filter: brightness(1);
      if (segment.type === 'highlight') {
        result.push(
          <span
            key={i}
            className="text-gold font-bold"
            style={{
              textShadow: '0 0 2px rgba(232, 185, 35, 0.9), 0 0 40px rgba(232, 185, 35, 0.25)',
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

  // Don't render anything until effect has started (charIndex >= 0)
  if (charIndex < 0) {
    return <span className="inline" />;
  }

  return (
    <span className="inline">
      {renderSegments()}
      {!isComplete && (
        <span className="animate-pulse ml-0.5 inline-block w-[3px] h-[1.2em] bg-white align-middle" />
      )}
    </span>
  );
}

function Snow() {
  const flakesRef = useRef<
    {
      left: string;
      opacity: number;
      duration: number;
      delay: number;
      size: number;
    }[]
  >([]);

  if (flakesRef.current.length === 0) {
    flakesRef.current = Array.from({ length: 120 }).map(() => ({
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.6 + 0.4,
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 10,
      size: Math.random() * 3 + 2,
    }));
  }

  return (
    <>
      <style>{`
        @keyframes snow-fall {
          0% {
            transform: translate3d(0, -10vh, 0);
          }
          100% {
            transform: translate3d(0, 110vh, 0);
          }
        }
      `}</style>
      <div
        id="whiter"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        {flakesRef.current.map((flake, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-10%',
              left: flake.left,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              borderRadius: '9999px',
              background: 'white',
              opacity: flake.opacity,
              animation: `snow-fall ${flake.duration}s linear infinite`,
              animationDelay: `${flake.delay}s`,
            }}
          />
        ))}
      </div>
    </>
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
  const hasMusicStarted = useRef(false);

  // Shared audio ref for typewriter sound - created once and unlocked on first tap
  const typewriterAudioRef = useRef<HTMLAudioElement | null>(null);
  const hdrVideoRef = useRef<HTMLVideoElement | null>(null);

  // Music is started when user clicks the final Continue/RSVP button (user gesture for mobile)

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

    // Play typewriter sound immediately (it's unlocked by user tap)
    audio.currentTime = TYPEWRITER_CONFIG.soundStartOffset;
    audio.play().catch(() => {
      // If play fails, still keep the audio reference
    });

    // NOTE: Do NOT touch the music player audio here!
    // Music will be unlocked and started when user clicks RSVP/Continue button
  };

  const handleStart = () => {
    unlockAudio();
    if (hdrVideoRef.current) {
      hdrVideoRef.current.play().catch(() => {});
    }
    setHasStarted(true);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (typewriterAudioRef.current) {
        typewriterAudioRef.current.pause();
        typewriterAudioRef.current = null;
      }
      if (hdrVideoRef.current) {
        hdrVideoRef.current.pause();
        hdrVideoRef.current = null;
      }
    };
  }, []);

  // Dev shortcut: Press Enter to skip intro (skips to title screen without starting music)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!hasStarted) {
          unlockAudio();
          if (hdrVideoRef.current) {
            hdrVideoRef.current.play().catch(() => {});
          }
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
    console.log('handleContinue called, isTypingComplete:', isTypingComplete);
    if (!isTypingComplete) return;

    // Check if this is the last screen
    const isLastScreen = currentScreen >= screens.length - 1;
    console.log('currentScreen:', currentScreen, 'screens.length:', screens.length, 'isLastScreen:', isLastScreen);

    // On last screen, stop typewriter and start music (user gesture for mobile)
    if (isLastScreen) {
      console.log('On last screen, stopping typewriter audio');
      console.log('typewriterAudioRef.current:', typewriterAudioRef.current);

      // ALWAYS stop typewriter sound completely
      if (typewriterAudioRef.current) {
        const audio = typewriterAudioRef.current;
        console.log('Stopping audio, paused:', audio.paused, 'src:', audio.src);
        audio.pause();
        audio.loop = false;  // Prevent any looping
        audio.currentTime = 0;
        audio.src = '';  // Clear the source to fully stop
        typewriterAudioRef.current = null;
        console.log('Audio stopped and ref cleared');
      } else {
        console.log('No typewriter audio ref to stop!');
      }

      if (!hasMusicStarted.current) {
        hasMusicStarted.current = true;

        // Directly play music player audio during user gesture (required for mobile)
        // This must happen synchronously during the click, not in a useEffect
        const musicAudio = document.querySelector('audio[data-music-player]') as HTMLAudioElement;
        console.log('Music audio element:', musicAudio);
        console.log('Music audio src:', musicAudio?.src);
        console.log('Music audio readyState:', musicAudio?.readyState);

        if (musicAudio) {
          // Apply offset before playing
          const offset = musicAudio.dataset.startOffset;
          if (offset) {
            musicAudio.currentTime = parseFloat(offset);
          }
          musicAudio.play().then(() => {
            console.log('Music started playing successfully');
          }).catch((err) => {
            console.log('Music autoplay blocked:', err);
          });
        } else {
          console.log('No music audio element found!');
        }

        // Also call onStartMusic to update the MusicPlayer's state
        onStartMusic();
      }
    }

    setIsFadingOut(true);

    setTimeout(() => {
      if (!isLastScreen) {
        setCurrentScreen(prev => prev + 1);
        setIsTypingComplete(false);
        setIsFadingOut(false);
      } else {
        // Show title screen
        setShowTitle(true);
        setIsFadingOut(false);
        // Animate title in stages
        setTimeout(() => setTitleAnimationStage(1), 100);
        setTimeout(() => setTitleAnimationStage(2), 600);
        setTimeout(() => setTitleAnimationStage(3), 1200);
      }
    }, 500);
  };

  const handleFinalContinue = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  const handleRSVPClick = () => {
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

        <div className="relative z-10 text-center px-6 whiter">
          <div className="text-4xl sm:text-6xl mb-6 animate-pulse">✨</div>
          <p id="whiter" className="text-white/80 text-lg sm:text-2xl font-display mb-8 whiter">
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
      {/* Basically you can force iOS / OSX post Liquid glass to render the page using EDR if you physically get it onto screen somehow. */}
      {/* In the past you could do this as a 0x0, but we need to trigger at least a 1x1 video to trigger once we have user input to enable */}
      {/* autoplay */}
      <video
        ref={hdrVideoRef}
        autoPlay
        muted
        loop
        playsInline
        className="fixed bottom-4 right-4 w-1 h-1 rounded-md"
        src="/media/white2.mp4"
      />

      {/* Optional subtle starfield over the black background */}

      <div className="relative w-full h-full max-w-5xl mx-auto flex flex-col items-center justify-center px-6 sm:px-8">
        <Snow />

        {/* Text container */}
        <div className="relative z-10 max-w-lg sm:max-w-3xl mx-auto text-center">
          <p
            id="whiter"
            className="text-white text-base sm:text-2xl md:text-4xl font-display leading-relaxed tracking-wide whiter"
          >
            <TypewriterText
              text={screens[currentScreen].text}
              onComplete={handleTypingComplete}
              audioRef={typewriterAudioRef}
            />
          </p>
        </div>

        {/* Continue button - use margin instead of absolute for mobile */}
        <button
          id="whiter"
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
    </div>
  );
}
