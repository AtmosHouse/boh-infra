import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CinematicIntro } from '../components/CinematicIntro/CinematicIntro';
import { MusicPlayer } from '../components/MusicPlayer/MusicPlayer';
import { Copy, Check, UserPlus, ExternalLink } from 'lucide-react';
import api from '../services/api';
import type { UserResponse } from '../types/api';

export function InvitePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [plusOne, setPlusOne] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [shouldStartMusic, setShouldStartMusic] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const [plusOneFirstName, setPlusOneFirstName] = useState('');
  const [plusOneLastName, setPlusOneLastName] = useState('');
  const [plusOneLoading, setPlusOneLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
        // Also fetch plus one if exists
        const plusOneData = await api.getPlusOne(parseInt(userId, 10));
        setPlusOne(plusOneData);
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
      setUser({ ...user, has_rsvped: true });
      // Don't set showPostRSVP - let the intro complete first, then show post-RSVP screen
    } catch {
      setError('Failed to RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleStartMusic = () => {
    setShouldStartMusic(true);
  };

  const handleAddPlusOne = async () => {
    if (!user || !plusOneFirstName.trim() || !plusOneLastName.trim()) return;

    setPlusOneLoading(true);
    try {
      const newPlusOne = await api.addPlusOne(user.id, {
        first_name: plusOneFirstName.trim(),
        last_name: plusOneLastName.trim(),
      });
      setPlusOne(newPlusOne);
      setPlusOneFirstName('');
      setPlusOneLastName('');
    } catch {
      setError('Failed to add plus one. Please try again.');
    } finally {
      setPlusOneLoading(false);
    }
  };

  const getPlusOneLink = () => {
    if (!plusOne) return '';
    return `${window.location.origin}/invite/${plusOne.id}`;
  };

  const copyPlusOneLink = () => {
    navigator.clipboard.writeText(getPlusOneLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (showIntro) {
    return (
      <>
        <CinematicIntro
          onComplete={() => {
            setShowIntro(false);
            // If user already RSVP'd during intro, showPostRSVP will already be true
          }}
          onStartMusic={handleStartMusic}
          guestName={user.first_name}
          showRSVPButton={true}
          onRSVP={rsvpLoading ? undefined : handleRSVP}
        />
        {/* Hide music player during intro - it will show after intro completes */}
        <MusicPlayer shouldStart={shouldStartMusic} hidden={true} />
      </>
    );
  }

  // Post-RSVP screen with plus one option
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a0a0a] to-[#0a0a0a] flex flex-col items-center justify-center p-8">
      {/* Snowfall effect */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/80 rounded-full animate-snowfall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-20 text-center max-w-md mx-auto">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-display text-snow mb-4"
          style={{ textShadow: '0 0 30px rgba(166, 61, 64, 0.5)' }}>
          You're In, {user.first_name}!
        </h1>
        <p className="text-gold text-lg mb-8 italic">
          Can't wait to see you at the feast!
        </p>

        {/* Plus One Section */}
        <div className="bg-gradient-to-br from-cranberry/10 to-holly/10 backdrop-blur-sm rounded-2xl border border-gold/20 p-6 mb-8">
          <h2 className="text-xl font-display text-snow mb-4 flex items-center justify-center gap-2">
            <UserPlus size={20} className="text-gold" />
            Bring a Plus One
          </h2>

          {plusOne ? (
            // Has a plus one already
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-snow/5 rounded-xl border border-snow/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cranberry to-holly flex items-center justify-center text-snow font-bold">
                  {plusOne.first_name[0]}{plusOne.last_name[0]}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-snow font-medium">
                    {plusOne.first_name} {plusOne.last_name}
                  </div>
                  <div className={`text-sm ${plusOne.has_rsvped ? 'text-holly' : 'text-snow/50'}`}>
                    {plusOne.has_rsvped ? '✓ RSVP\'d' : 'Awaiting RSVP'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-snow/70 text-sm">Share this link with your plus one:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPlusOneLink()}
                    className="flex-1 bg-snow/10 text-snow text-sm px-3 py-2 rounded-lg border border-snow/20 overflow-hidden text-ellipsis"
                  />
                  <button
                    onClick={copyPlusOneLink}
                    className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-all flex items-center gap-2"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // No plus one yet - show form
            <div className="space-y-4">
              <p className="text-snow/70 text-sm">
                Want to bring someone? Enter their name below.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="First Name"
                  value={plusOneFirstName}
                  onChange={(e) => setPlusOneFirstName(e.target.value)}
                  className="flex-1 bg-snow/10 text-snow placeholder:text-snow/40 px-4 py-3 rounded-lg border border-snow/20 focus:border-gold/50 outline-none transition-all"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={plusOneLastName}
                  onChange={(e) => setPlusOneLastName(e.target.value)}
                  className="flex-1 bg-snow/10 text-snow placeholder:text-snow/40 px-4 py-3 rounded-lg border border-snow/20 focus:border-gold/50 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleAddPlusOne}
                disabled={plusOneLoading || !plusOneFirstName.trim() || !plusOneLastName.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-cranberry to-holly text-snow font-medium rounded-lg hover:from-cranberry-dark hover:to-holly-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {plusOneLoading ? 'Creating...' : 'Create Invite Link'}
              </button>
            </div>
          )}
        </div>

        {/* View Guest List Button */}
        <button
          onClick={() => navigate(`/rsvp?userId=${user.id}`)}
          className="flex items-center justify-center gap-2 mx-auto text-gold hover:text-snow transition-colors"
        >
          <ExternalLink size={16} />
          View Guest List
        </button>
      </div>

      <MusicPlayer shouldStart={shouldStartMusic} />
    </div>
  );
}

