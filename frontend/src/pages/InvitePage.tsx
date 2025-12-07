import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CinematicIntro } from '../components/CinematicIntro/CinematicIntro';
import { useMusicContext } from '../App';
import api from '../services/api';
import type { UserResponse } from '../types/api';

export function InvitePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { startMusic } = useMusicContext();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        const userData = await api.getUser(parseInt(userId, 10));
        setUser(userData);
      } catch {
        setError('This invite link is not valid. Please check your link and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const navigateToRSVP = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigate(`/xmas/rsvp?userId=${user?.id}`);
    }, 500);
  };

  const handleRSVP = () => {
    if (!user) return;

    // Fire and forget - don't await, navigate immediately
    api.rsvp(user.id).catch(() => {
      // Silently fail - user is already on RSVP page
    });

    navigateToRSVP();
  };

  const handleStartMusic = () => {
    startMusic();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        {/* Subtle starfield */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-snow text-xl sm:text-2xl font-display animate-pulse">
          Loading your invitation...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8">
        {/* Subtle starfield */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-snow text-2xl font-display mb-4">Oops!</h1>
          <p className="text-snow/70 text-center max-w-md">
            {error || 'Something went wrong. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  // Show cinematic intro - after RSVP, user will be navigated to RSVP page
  return (
    <div className={`transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <CinematicIntro
        onComplete={navigateToRSVP}
        onStartMusic={handleStartMusic}
        guestName={user.first_name}
        showRSVPButton={true}
        onRSVP={handleRSVP}
      />
    </div>
  );
}

