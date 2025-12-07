import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Navigation, Footer } from './components/Layout';
import { DishManager, ShoppingList } from './components/Features';
import { Snowfall } from './components/Decorations';
import { MusicPlayer } from './components/MusicPlayer';
import { CinematicIntro } from './components/CinematicIntro';
import { InvitePage } from './pages/InvitePage';
import { RSVPPage } from './pages/RSVPPage';

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
        <Route path="/" element={<MainApp />} />
        <Route path="/invite/:userId" element={<InvitePage />} />
        <Route path="/rsvp" element={<RSVPPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
