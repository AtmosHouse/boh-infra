import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { MusicPlayer } from './components/MusicPlayer';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Xmas routes with shared music player */}
        <Route path="/xmas" element={<XmasLayout />}>
          <Route index element={<RSVPPage />} />
          <Route path="invite/:userId" element={<InvitePage />} />
          <Route path="rsvp" element={<RSVPPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
