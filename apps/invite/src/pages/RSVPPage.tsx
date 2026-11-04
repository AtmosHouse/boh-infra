import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, UtensilsCrossed, X, UserPlus, Copy, Check } from 'lucide-react';
import { Snowfall } from '../components/Decorations';
import { Chat } from '../components/Chat';
import { useMusicContext } from '../App';
import api from '../services/api';
import type { RSVPListResponse, UserPublicResponse, UserResponse } from '../types/api';

// Hardcoded menu items - fill in manually
const MENU_ITEMS = {
  firstCourse: [
    { name: 'Miso-Mushroom Sausage Rolls', description: 'Savory mushroom and miso sausage wrapped in flaky pastry' },
    { name: 'Hibiscus Beef Tartare', description: 'Hand-chopped beef with hibiscus, herbs, and crisp garnish' },
    { name: 'Prosciutto Wrapped Baked Brie Rolls', description: 'Warm brie wrapped in prosciutto and pastry' },
    { name: 'Fig & Goat Cheese Puff Pastry Roll', description: 'Caramelized figs and tangy goat cheese in golden puff pastry' },
  ],
  soup: [
    { name: 'Butternut Squash Soup', description: 'Silky roasted butternut squash with aromatic spices' },
  ],
  mains: [
    { name: 'Deux Wellington (Beef and Mushroom)', description: 'Classic beef Wellington alongside a mushroom duxelles Wellington' },
    { name: 'Roast Duck', description: 'Crispy-skinned roast duck with rich pan jus' },
  ],
  sides: [
    { name: 'Mashed Potatoes', description: 'Creamy, buttery mashed potatoes' },
    { name: 'Cranberry Sauce', description: 'Bright, tart cranberry compote' },
    { name: 'Green Bean Casserole', description: 'Baked green beans with creamy sauce and crispy topping' },
  ],
  dessert: [
    { name: 'Cheesecake', description: 'Rich, creamy cheesecake with seasonal toppings' },
    { name: 'Pies', description: 'Assorted seasonal pies' },
    { name: 'Eggnog', description: 'Classic spiced eggnog, served chilled' },
  ],
  drinks: [
    { name: 'Mulled Wine', description: 'Warm spiced red wine with citrus and aromatics' },
    { name: 'Whiskey Bar', description: 'Selection of whiskeys served neat or on the rocks' },
  ],
};


export function RSVPPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const { setHideMusicPlayer } = useMusicContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // DEBUG: Log on every render
  console.log('[RSVPPage] RENDER - userId:', userId, 'searchParams:', searchParams.toString());

  const [rsvpData, setRsvpData] = useState<RSVPListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Plus one state
  const [showPlusOneModal, setShowPlusOneModal] = useState(false);
  const [plusOne, setPlusOne] = useState<UserResponse | null>(null);
  const [plusOneFirstName, setPlusOneFirstName] = useState('');
  const [plusOneLastName, setPlusOneLastName] = useState('');
  const [plusOneLoading, setPlusOneLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fade in on mount and ensure music player is visible
  useEffect(() => {
    console.log('[RSVPPage] Component MOUNTED');
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    // Show music player on RSVP page (user arrived here from InvitePage)
    setHideMusicPlayer(false);

    return () => {
      console.log('[RSVPPage] Component UNMOUNTED');
    };
  }, [setHideMusicPlayer]);

  // Debug: log all state changes
  useEffect(() => {
    console.log('[RSVPPage] State:', { loading, error, userId, isVisible, rsvpData: !!rsvpData });
  }, [loading, error, userId, isVisible, rsvpData]);

  // Ensure video keeps playing with comprehensive debugging
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastTimeUpdate = 0;

    const handlePause = () => {
      console.log('[Video] Paused - paused:', video.paused, 'ended:', video.ended, 'readyState:', video.readyState);
      if (video.paused && !video.ended) {
        video.play().catch((e) => console.log('[Video] Resume failed:', e));
      }
    };

    const handleError = () => {
      console.error('[Video] Error:', video.error);
    };

    const handleLoadedData = () => {
      console.log('[Video] Loaded data - duration:', video.duration, 'readyState:', video.readyState);
    };

    const handleCanPlay = () => {
      console.log('[Video] Can play - readyState:', video.readyState);
      video.play().catch((e) => console.log('[Video] Play on canplay failed:', e));
    };

    const handlePlaying = () => {
      console.log('[Video] Playing - currentTime:', video.currentTime);
    };

    const handleTimeUpdate = () => {
      // Log every 5 seconds to avoid spam
      if (Math.floor(video.currentTime) % 5 === 0 && Math.floor(video.currentTime) !== lastTimeUpdate) {
        lastTimeUpdate = Math.floor(video.currentTime);
        console.log('[Video] Time update:', video.currentTime.toFixed(1), 'paused:', video.paused);
      }
    };

    const handleStalled = () => {
      console.log('[Video] Stalled - readyState:', video.readyState, 'networkState:', video.networkState);
    };

    const handleWaiting = () => {
      console.log('[Video] Waiting - readyState:', video.readyState);
    };

    const handleEnded = () => {
      console.log('[Video] Ended - should loop but ended');
    };

    const handleEmptied = () => {
      console.log('[Video] Emptied - video source was removed or changed');
    };

    const handleSuspend = () => {
      console.log('[Video] Suspend - loading suspended');
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      console.log('[Video] Visibility changed - hidden:', document.hidden);
      if (!document.hidden && video.paused) {
        video.play().catch((e) => console.log('[Video] Resume on visibility failed:', e));
      }
    };

    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('emptied', handleEmptied);
    video.addEventListener('suspend', handleSuspend);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Try to play on mount
    console.log('[Video] Initial state - paused:', video.paused, 'readyState:', video.readyState, 'src:', video.currentSrc);
    video.play().catch((e) => console.log('[Video] Initial play failed:', e));

    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('emptied', handleEmptied);
      video.removeEventListener('suspend', handleSuspend);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Only fetch if userId is present
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRSVPList = async () => {
      try {
        const data = await api.getRSVPList();
        setRsvpData(data);

        // Fetch their plus one
        const plusOneData = await api.getPlusOne(userId);
        setPlusOne(plusOneData);
      } catch {
        setError('Failed to load guest list');
      } finally {
        setLoading(false);
      }
    };

    fetchRSVPList();
  }, [userId]);

  // Show access denied if no userId
  if (!userId) {
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
          <div className="text-6xl mb-6">🎄</div>
          <h1 className="text-snow text-2xl sm:text-3xl font-display mb-4">Invitation Required</h1>
          <p className="text-snow/70 text-center max-w-md">
            This event is invite-only. Please use your personal invite link to access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleAddPlusOne = async () => {
    if (!userId || !plusOneFirstName.trim() || !plusOneLastName.trim()) return;

    setPlusOneLoading(true);
    try {
      const newPlusOne = await api.addPlusOne(userId, {
        first_name: plusOneFirstName.trim(),
        last_name: plusOneLastName.trim(),
      });
      setPlusOne(newPlusOne);
      setPlusOneFirstName('');
      setPlusOneLastName('');
      // Refresh the RSVP list
      const data = await api.getRSVPList();
      setRsvpData(data);
    } catch {
      // Handle error silently or show a message
    } finally {
      setPlusOneLoading(false);
    }
  };

  const getPlusOneLink = () => {
    if (!plusOne) return '';
    return `${window.location.origin}/xmas/invite/${plusOne.id}`;
  };

  const copyPlusOneLink = () => {
    navigator.clipboard.writeText(getPlusOneLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Video Background - OUTSIDE main container, using z-0 as base */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#0a0a0a] via-[#1a0a0a] to-black" />
      <div className="fixed inset-0 z-10 border-4">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        >
          <source src="/media/background-compressed.mp4" type="video/mp4" />
        </video>
      </div>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-20 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 z-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(166, 61, 64, 0.2) 0%, transparent 50%)' }} />
      <div className="fixed inset-0 z-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(30, 86, 49, 0.2) 0%, transparent 50%)' }} />
      <div className="fixed inset-0 z-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(232, 185, 35, 0.08) 0%, transparent 60%)' }} />

      <div className={`min-h-screen relative z-40 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <Snowfall />

      {/* Main content */}
      <div className="relative z-50 min-h-screen py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Two column layout */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Left Column - Guest List */}
            <div className="order-2 lg:order-1">
              <div className="bg-cocoa/30 backdrop-blur-md rounded-2xl border border-gold/20 p-6 sm:p-8 shadow-warm-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display text-snow">Guest List</h2>
                  {rsvpData && (
                    <span className="text-gold font-medium">
                      {rsvpData.total_rsvped} attending
                    </span>
                  )}
                </div>

                {error && (
                  <div className="text-cranberry text-center py-8">
                    {error}
                  </div>
                )}

                {!loading && rsvpData && rsvpData.users.length === 0 && (
                  <div className="text-snow/50 text-center py-8 italic">
                    No RSVPs yet. Be the first!
                  </div>
                )}

                {rsvpData && rsvpData.users.length > 0 && (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {/* Current user's card first */}
                    {rsvpData.users
                      .filter((user: UserPublicResponse) => user.id === userId)
                      .map((user: UserPublicResponse) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-snow/5 border border-gold/40 transition-all duration-300"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cranberry to-holly flex items-center justify-center text-snow font-bold text-sm">
                            {user.first_name[0]}{user.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-snow font-medium truncate">
                              {user.first_name} {user.last_name}
                              <span className="ml-2 text-xs text-gold/70 bg-gold/10 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            </div>
                            {user.rsvped_at && (
                              <div className="text-snow/50 text-xs">
                                RSVP'd {formatDate(user.rsvped_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    {/* Other guests */}
                    {rsvpData.users
                      .filter((user: UserPublicResponse) => user.id !== userId)
                      .map((user: UserPublicResponse, index: number) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-snow/5 border border-snow/10 hover:border-gold/30 transition-all duration-300"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cranberry to-holly flex items-center justify-center text-snow font-bold text-sm">
                            {user.first_name[0]}{user.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-snow font-medium truncate">
                              {user.first_name} {user.last_name}
                              {user.is_plus_one && (
                                <span className="ml-2 text-xs text-gold/70 bg-gold/10 px-2 py-0.5 rounded-full">
                                  +1
                                </span>
                              )}
                            </div>
                            {user.rsvped_at && (
                              <div className="text-snow/50 text-xs">
                                RSVP'd {formatDate(user.rsvped_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Loading state when no data yet */}
                {loading && !rsvpData && (
                  <div className="flex items-center justify-center gap-2 py-8 text-snow/70 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-2 text-sm">Loading guests...</span>
                  </div>
                )}

                {/* Add Plus One Button - only show if userId is present */}
                {userId && (
                  <button
                    onClick={() => setShowPlusOneModal(true)}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gold/20 text-gold font-medium rounded-xl border border-gold/30 hover:bg-gold/30 transition-all duration-300"
                  >
                    <UserPlus size={18} />
                    {plusOne ? 'View Plus One' : 'Add a Plus One'}
                  </button>
                )}
              </div>

              {/* Chat Component - below guest list */}
              {userId && (
                <div className="mt-8">
                  <Chat userId={userId} />
                </div>
              )}
            </div>

            {/* Right Column - Event Details */}
            <div className="order-1 lg:order-2 space-y-6">
              {/* Event Image */}
              <div className="rounded-2xl overflow-hidden border border-gold/20 shadow-warm-lg">
                <img
                  src="https://images.unsplash.com/photo-1482275548304-a58859dc31b7?w=800&q=80"
                  alt="Holiday Feast"
                  className="w-full h-48 sm:h-64 object-cover"
                />
              </div>

              {/* Event Info Card */}
              <div className="bg-cocoa/30 backdrop-blur-md rounded-2xl border border-gold/20 p-6 sm:p-8 shadow-warm-lg">
                <h1 className="text-3xl sm:text-4xl font-display text-snow mb-2"
                  style={{ textShadow: '0 0 30px rgba(166, 61, 64, 0.5)' }}>
                  Atmosphere Holiday Feast
                </h1>
                <p className="text-gold text-lg italic mb-6">
                  A cozy evening of good food & great company
                </p>

                {/* Date & Time */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-cranberry/20 flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-cranberry" />
                  </div>
                  <div>
                    <div className="text-snow font-medium">Saturday, December 13th, 2025</div>
                    <div className="text-snow/60 text-sm">6:00 PM - Late</div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-holly/20 flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-holly" />
                  </div>
                  <div>
                    <div className="text-snow font-medium">Atmosphere House</div>
                    <div className="text-snow/60 text-sm">1628 Washington Street, San Francisco, CA 94109</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-snow/80 text-sm leading-relaxed mb-6">
                  Join William and Jeffrey for an unforgettable evening of holiday cheer!
                  We'll be serving a multi-course feast prepared with love, paired with
                  warm drinks and even warmer company. Dress code: Cozy festive.
                </p>

                {/* View Menu Button */}
                <button
                  onClick={() => setShowMenuModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cranberry to-holly text-snow font-medium rounded-xl hover:from-cranberry-dark hover:to-holly-dark transition-all duration-300 shadow-warm-md hover:shadow-warm-lg"
                >
                  <UtensilsCrossed size={20} />
                  View Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMenuModal(false)}
          />
          <div className="relative bg-cocoa/95 backdrop-blur-md rounded-2xl border border-gold/30 p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-warm-lg animate-fade-in-up">
            <button
              onClick={() => setShowMenuModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-snow/10 text-snow/70 hover:bg-snow/20 hover:text-snow flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>

            <h2 className="text-3xl font-display text-snow mb-2 text-center">
              Holiday Feast Menu
            </h2>
            <p className="text-gold text-center italic mb-8">
              Prepared with love
            </p>

            {/* First Course */}
            <div className="mb-6">
              <h3 className="text-lg font-display text-cranberry mb-3 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-cranberry/50"></span>
                First Course
                <span className="flex-1 h-[1px] bg-cranberry/50"></span>
              </h3>
              <div className="space-y-3">
                {MENU_ITEMS.firstCourse.map((item, i) => (
                  <div key={i} className="pl-4">
                    <div className="text-snow font-medium">{item.name}</div>
                    <div className="text-snow/60 text-sm">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Course */}
            <div className="mb-6">
              <h3 className="text-lg font-display text-cranberry mb-3 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-cranberry/50"></span>
                Main Course
                <span className="flex-1 h-[1px] bg-cranberry/50"></span>
              </h3>
              <div className="space-y-3">
                {MENU_ITEMS.mains.map((item, i) => (
                  <div key={i} className="pl-4">
                    <div className="text-snow font-medium">{item.name}</div>
                    <div className="text-snow/60 text-sm">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sides */}
            <div className="mb-6">
              <h3 className="text-lg font-display text-holly mb-3 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-holly/50"></span>
                Sides
                <span className="flex-1 h-[1px] bg-holly/50"></span>
              </h3>
              <div className="space-y-3">
                {MENU_ITEMS.sides.map((item, i) => (
                  <div key={i} className="pl-4">
                    <div className="text-snow font-medium">{item.name}</div>
                    <div className="text-snow/60 text-sm">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desserts */}
            <div className='mb-6'>
              <h3 className="text-lg font-display text-gold mb-3 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-gold/50"></span>
                Desserts
                <span className="flex-1 h-[1px] bg-gold/50"></span>
              </h3>
              <div className="space-y-3">
                {MENU_ITEMS.dessert.map((item, i) => (
                  <div key={i} className="pl-4">
                    <div className="text-snow font-medium">{item.name}</div>
                    <div className="text-snow/60 text-sm">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Beverages */}
            <div>
              <h3 className="text-lg font-display text-gold mb-3 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-gold/50"></span>
                Beverages
                <span className="flex-1 h-[1px] bg-gold/50"></span>
              </h3>
              <div className="space-y-3">
                {MENU_ITEMS.drinks.map((item, i) => (
                  <div key={i} className="pl-4">
                    <div className="text-snow font-medium">{item.name}</div>
                    <div className="text-snow/60 text-sm">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plus One Modal - only show after data is loaded and button is clicked */}
      {showPlusOneModal && userId && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPlusOneModal(false)}
          />
          <div className="relative bg-cocoa/95 backdrop-blur-md rounded-2xl border border-gold/30 p-6 sm:p-8 max-w-md w-full shadow-warm-lg">
            <button
              onClick={() => setShowPlusOneModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-snow/10 text-snow/70 hover:bg-snow/20 hover:text-snow flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>

            <h2 className="text-2xl font-display text-snow mb-2 text-center flex items-center justify-center gap-2">
              <UserPlus size={24} className="text-gold" />
              Plus One
            </h2>
            <p className="text-snow/60 text-center text-sm mb-6">
              {plusOne ? 'Your plus one\'s invite details' : 'Bring someone special to the feast'}
            </p>

            {plusOne ? (
              // Has a plus one already - show details
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-snow/5 rounded-xl border border-snow/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cranberry to-holly flex items-center justify-center text-snow font-bold">
                    {plusOne.first_name[0]}{plusOne.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-snow font-medium">
                      {plusOne.first_name} {plusOne.last_name}
                    </div>
                    <div className={`text-sm ${plusOne.has_rsvped ? 'text-holly' : 'text-snow/50'}`}>
                      {plusOne.has_rsvped ? '✓ RSVP\'d' : 'Awaiting RSVP'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-snow/70 text-sm">Share this invite link:</p>
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
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={plusOneFirstName}
                    onChange={(e) => setPlusOneFirstName(e.target.value)}
                    className="w-full bg-snow/10 text-snow placeholder:text-snow/40 px-4 py-3 rounded-lg border border-snow/20 focus:border-gold/50 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={plusOneLastName}
                    onChange={(e) => setPlusOneLastName(e.target.value)}
                    className="w-full bg-snow/10 text-snow placeholder:text-snow/40 px-4 py-3 rounded-lg border border-snow/20 focus:border-gold/50 outline-none transition-all"
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
        </div>
      )}
      </div>
    </>
  );
}

