import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CinematicIntro } from '../components/CinematicIntro/CinematicIntro';
import { MusicPlayer } from '../components/MusicPlayer/MusicPlayer';
import api from '../services/api';
import type { UserResponse } from '../types/api';

export function InvitePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldStartMusic, setShouldStartMusic] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

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

  const handleRSVP = async () => {
    if (!user) return;

    setRsvpLoading(true);
    try {
      await api.rsvp(user.id);
      // Navigate directly to RSVP page after successful RSVP
      navigate(`/rsvp?userId=${user.id}`);
    } catch {
      setError('Failed to RSVP. Please try again.');
      setRsvpLoading(false);
    }
  };

  const handleStartMusic = () => {
    setShouldStartMusic(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a0a0a] to-black flex items-center justify-center">
        <div className="text-snow text-xl animate-pulse">Loading your invitation...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a0a0a] to-black flex flex-col items-center justify-center p-8">
        <h1 className="text-snow text-2xl font-display mb-4">Oops!</h1>
        <p className="text-snow/70 text-center max-w-md">
          {error || 'Something went wrong. Please try again.'}
        </p>
      </div>
    );
  }

  // Show cinematic intro - after RSVP, user will be navigated to RSVP page
  return (
    <>
      <CinematicIntro
        onComplete={() => {
          // If intro completes without RSVP, navigate to RSVP page anyway
          navigate(`/rsvp?userId=${user.id}`);
        }}
        onStartMusic={handleStartMusic}
        guestName={user.first_name}
        showRSVPButton={!user.has_rsvped}
        onRSVP={rsvpLoading ? undefined : handleRSVP}
      />
      {/* Hide music player during intro */}
      <MusicPlayer shouldStart={shouldStartMusic} hidden={true} />
    </>
  );
}

