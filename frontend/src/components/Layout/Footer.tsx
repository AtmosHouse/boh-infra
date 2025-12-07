import { Heart, Snowflake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden text-center mt-auto p-4 sm:p-8 bg-gradient-to-t from-black/80 via-holly-dark/30 to-transparent border-t border-gold/20"
      style={{ boxShadow: 'inset 0 20px 60px rgba(0,0,0,0.3)' }}>
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(30, 86, 49, 0.2) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(232, 185, 35, 0.08) 0%, transparent 40%)' }} />

      {/* Snowflakes - fewer on mobile */}
      <div className="flex justify-center gap-4 sm:gap-6 mb-2 relative z-[1]">
        {Array.from({ length: 3 }).map((_, i) => (
          <Snowflake
            key={i}
            className="text-snow/60 animate-[drift_3s_ease-in-out_infinite]"
            style={{ animationDelay: i % 3 === 0 ? '1s' : i % 2 === 0 ? '0.5s' : '0s', filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))' }}
            size={12}
          />
        ))}
      </div>

      {/* Text */}
      <p className="text-snow/90 text-xs sm:text-sm flex items-center justify-center gap-1 relative z-[1] flex-wrap">
        Made with <Heart className="text-cranberry animate-[beat_1s_ease-in-out_infinite]" size={12} style={{ filter: 'drop-shadow(0 0 6px rgba(166, 61, 64, 0.8))' }} /> by Atmosphere
      </p>
      <p className="text-gold/80 text-xs mt-1 italic relative z-[1]" style={{ textShadow: '0 0 10px rgba(232, 185, 35, 0.3)' }}>Happy Holidays 2025</p>
    </footer>
  );
}

