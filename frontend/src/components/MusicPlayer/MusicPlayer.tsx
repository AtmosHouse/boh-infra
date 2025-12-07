import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

interface Song {
  title: string;
  artist: string;
  url: string;
  startOffset?: number; // Start timestamp in seconds
}

// Royalty-free Christmas music from Free Music Archive and similar sources
const christmasSongs: Song[] = [
  {
    title: 'The Christmas Song',
    artist: 'Nat King Cole',
    url: '/media/xmas_song.mp3',
    startOffset: 7, // Start from 6 seconds in
  },
  {
    title: 'The Christmas Waltz',
    artist: 'Laufey',
    url: '/media/xmas_waltz.mp3',
    startOffset: 0, // Start from 10 seconds in
  }

];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface MusicPlayerProps {
  shouldStart?: boolean;
  hidden?: boolean;
}

export function MusicPlayer({ shouldStart = false, hidden = false }: MusicPlayerProps) {
  // Start with Christmas Song first, then shuffle the rest after it
  const [playlist, setPlaylist] = useState(() => {
    // Keep first song (The Christmas Song) at the start, shuffle the rest
    const [firstSong, ...rest] = christmasSongs;
    return [firstSong, ...shuffleArray(rest)];
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAppliedOffset = useRef(false);

  const currentSong = playlist[currentIndex];

  const playNext = useCallback(() => {
    hasAppliedOffset.current = false; // Reset offset flag for new song
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  const playPrev = () => {
    hasAppliedOffset.current = false; // Reset offset flag for new song
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const reshuffle = () => {
    hasAppliedOffset.current = false;
    setPlaylist(shuffleArray(christmasSongs));
    setCurrentIndex(0);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Start music when shouldStart becomes true (triggered by intro)
  useEffect(() => {
    if (!shouldStart || hasAutoStarted || !audioRef.current) return;

    const audio = audioRef.current;

    // Wait for audio to be ready, then apply offset and play
    const startPlayback = () => {
      if (currentSong.startOffset && !hasAppliedOffset.current) {
        audio.currentTime = currentSong.startOffset;
        hasAppliedOffset.current = true;
      }

      audio.play()
        .then(() => {
          setIsPlaying(true);
          setHasAutoStarted(true);
        })
        .catch(() => {
          // Autoplay blocked on mobile - still mark as started so player shows
          console.log('Autoplay blocked');
          setHasAutoStarted(true);
        });
    };

    if (audio.readyState >= 3) {
      // Audio is already ready
      startPlayback();
    } else {
      // Wait for audio to be ready
      audio.addEventListener('canplay', startPlayback, { once: true });
      return () => audio.removeEventListener('canplay', startPlayback);
    }
  }, [shouldStart, hasAutoStarted, currentSong.startOffset]);

  // Handle song changes - wait for new song to load before playing
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    const audio = audioRef.current;

    const playWhenReady = () => {
      if (currentSong.startOffset && !hasAppliedOffset.current) {
        audio.currentTime = currentSong.startOffset;
        hasAppliedOffset.current = true;
      }
      audio.play().catch(() => setIsPlaying(false));
    };

    if (audio.readyState >= 3) {
      playWhenReady();
    } else {
      audio.addEventListener('canplay', playWhenReady, { once: true });
      return () => audio.removeEventListener('canplay', playWhenReady);
    }
  }, [currentIndex, isPlaying, currentSong.startOffset]);

  // Show the player when not hidden and either autostart completed or no autostart needed
  const shouldShow = !hidden && (hasAutoStarted || !shouldStart);

  return (
    <div className={`fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-[1001] flex items-end gap-2 transition-opacity duration-500 ${shouldShow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <audio
        ref={audioRef}
        src={currentSong.url}
        onEnded={playNext}
        onError={playNext}
      />

      <button
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-warm-lg transition-all duration-300 border-2 border-gold active:scale-95 hover:scale-110 hover:shadow-glow ${isExpanded ? 'bg-gradient-to-br from-holly to-holly-dark' : 'bg-gradient-to-br from-cranberry to-cranberry-dark'} text-snow`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Music size={18} className="sm:w-5 sm:h-5" />
      </button>

      {isExpanded && (
        <div className="bg-gradient-to-br from-cocoa/95 to-[rgba(30,20,15,0.98)] backdrop-blur-[10px] rounded-xl p-3 sm:p-4 flex flex-col gap-2 min-w-[160px] sm:min-w-[220px] border border-gold/30 shadow-warm-lg animate-slideIn">
          <div className="flex flex-col gap-0.5 pb-2 border-b border-white/10">
            <span className="text-snow font-semibold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{currentSong.title}</span>
            <span className="text-gold text-[10px] sm:text-xs italic">{currentSong.artist}</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <button onClick={playPrev} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 text-snow flex items-center justify-center transition-all duration-200 active:bg-white/30 hover:bg-white/20 hover:text-gold">
              <SkipBack size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button onClick={togglePlay} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cranberry to-cranberry-dark text-snow flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-110 hover:shadow-[0_0_15px_rgba(155,35,53,0.5)]">
              {isPlaying ? <Pause size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Play size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>
            <button onClick={playNext} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 text-snow flex items-center justify-center transition-all duration-200 active:bg-white/30 hover:bg-white/20 hover:text-gold">
              <SkipForward size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 text-snow flex items-center justify-center transition-all duration-200 active:bg-white/30 hover:bg-white/20 hover:text-gold">
              {isMuted ? <VolumeX size={14} className="sm:w-4 sm:h-4" /> : <Volume2 size={14} className="sm:w-4 sm:h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 sm:h-1 appearance-none bg-white/20 rounded cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          <button onClick={reshuffle} className="px-2 py-1.5 sm:py-1 bg-gold/20 text-gold rounded text-xs font-medium transition-all duration-200 active:bg-gold/40 hover:bg-gold/30">
            Shuffle
          </button>
        </div>
      )}
    </div>
  );
}

