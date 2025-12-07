import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Header, Navigation, Footer } from './components/Layout';
import { DishManager, ShoppingList } from './components/Features';
import { Snowfall } from './components/Decorations';
import { MusicPlayer } from './components/MusicPlayer';
import { CinematicIntro } from './components/CinematicIntro';
import { InvitePage } from './pages/InvitePage';
import { RSVPPage } from './pages/RSVPPage';

// Music context for sharing music state across xmas routes
interface MusicContextType {
  shouldStartMusic: boolean;
  startMusic: () => void;
  hideMusicPlayer: boolean;
  setHideMusicPlayer: (hide: boolean) => void;
}

const MusicContext = createContext<MusicContextType>({
  shouldStartMusic: false,
  startMusic: () => {},
  hideMusicPlayer: false,
  setHideMusicPlayer: () => {},
});

export const useMusicContext = () => useContext(MusicContext);

// Wrapper for xmas routes that provides persistent music player
function XmasLayout() {
  const [shouldStartMusic, setShouldStartMusic] = useState(false);
  const [hideMusicPlayer, setHideMusicPlayer] = useState(true); // Hidden by default during intro

  const startMusic = () => {
    setShouldStartMusic(true);
  };

  return (
    <MusicContext.Provider value={{ shouldStartMusic, startMusic, hideMusicPlayer, setHideMusicPlayer }}>
      <Outlet />
      {/* Persistent music player for all xmas routes */}
      <MusicPlayer shouldStart={shouldStartMusic} hidden={hideMusicPlayer} />
    </MusicContext.Provider>
  );
}

function LandingPage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      {/* Subtle vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        <h1
          className="text-snow text-4xl sm:text-6xl md:text-7xl font-display tracking-widest mb-4"
          style={{
            textShadow: '0 0 40px rgba(255,255,255,0.1), 0 0 80px rgba(255,255,255,0.05)'
          }}
        >
          Atmos House
        </h1>
        <p
          className="text-snow/40 text-sm sm:text-base tracking-[0.3em] uppercase"
        >
          Est. 2020 · SF, CA
        </p>
      </div>
    </div>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('dishes');
  const [showIntro, setShowIntro] = useState(true);
  const [shouldStartMusic, setShouldStartMusic] = useState(false);
  const [isAppVisible, setIsAppVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'dishes':
        return <DishManager />;
      case 'shopping':
        return <ShoppingList />;
      default:
        return <DishManager />;
    }
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleStartMusic = () => {
    setShouldStartMusic(true);
  };

  // Fade in the app after intro completes
  useEffect(() => {
    if (!showIntro) {
      // Small delay to ensure DOM is ready, then fade in
      requestAnimationFrame(() => {
        setIsAppVisible(true);
      });
    }
  }, [showIntro]);

  // Ensure video keeps playing
  useEffect(() => {
    if (!showIntro && videoRef.current) {
      const video = videoRef.current;

      const handlePause = () => {
        // If video pauses unexpectedly, try to resume
        if (video.paused && !video.ended) {
          video.play().catch(() => {});
        }
      };

      const handleError = () => {
        console.error('Video error:', video.error);
      };

      video.addEventListener('pause', handlePause);
      video.addEventListener('error', handleError);

      // Try to play on mount
      video.play().catch(() => {});

      return () => {
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('error', handleError);
      };
    }
  }, [showIntro]);

  return (
    <>
      {/* Music player - always mounted, visibility controlled */}
      <MusicPlayer shouldStart={shouldStartMusic} hidden={showIntro} />

      {showIntro ? (
        <CinematicIntro
          onComplete={handleIntroComplete}
          onStartMusic={handleStartMusic}
        />
      ) : (
        <div className={`min-h-screen flex flex-col transition-opacity duration-1000 ${isAppVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* Fallback background - always visible behind video */}
          <div className="fixed inset-0 -z-30 bg-gradient-to-b from-[#0a0a0a] via-[#1a0a0a] to-black" />

          {/* Video Background */}
          <div className="fixed inset-0 -z-20">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.6) saturate(0.8)' }}
            >
              <source src="/media/background-compressed.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Dark overlay on top of video */}
          <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

          {/* Ambient glow effects */}
          <div className="fixed inset-0 -z-[9] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(166, 61, 64, 0.2) 0%, transparent 50%)' }} />
          <div className="fixed inset-0 -z-[9] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(30, 86, 49, 0.2) 0%, transparent 50%)' }} />
          <div className="fixed inset-0 -z-[9] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(232, 185, 35, 0.08) 0%, transparent 60%)' }} />

          <Snowfall />
          <Header />
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="flex-1 py-4 sm:py-8 px-3 sm:px-4 relative z-0">
            <div className="max-w-5xl mx-auto">
              {renderContent()}
            </div>
          </main>

          <Footer />
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Xmas routes with shared music player */}
        <Route path="/xmas" element={<XmasLayout />}>
          <Route index element={<RSVPPage />} />
          <Route path="planner" element={<MainApp />} />
          <Route path="invite/:userId" element={<InvitePage />} />
          <Route path="rsvp" element={<RSVPPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
