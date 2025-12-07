import { useState, useEffect, createContext, useContext } from 'react';
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
}

const MusicContext = createContext<MusicContextType>({
  shouldStartMusic: false,
  startMusic: () => {},
});

export const useMusicContext = () => useContext(MusicContext);

// Wrapper for xmas routes that provides persistent music player
function XmasLayout() {
  const [shouldStartMusic, setShouldStartMusic] = useState(false);

  const startMusic = () => {
    setShouldStartMusic(true);
  };

  return (
    <MusicContext.Provider value={{ shouldStartMusic, startMusic }}>
      <Outlet />
      {/* Persistent music player for all xmas routes */}
      <MusicPlayer shouldStart={shouldStartMusic} />
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
          {/* Video Background */}
          <div className="fixed inset-0 -z-20 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute min-w-full min-h-full object-cover"
              style={{ filter: 'brightness(0.6) saturate(0.8)' }}
            >
              <source src="https://cdn.pixabay.com/video/2023/12/03/191856-891315505_large.mp4" type="video/mp4" />
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
