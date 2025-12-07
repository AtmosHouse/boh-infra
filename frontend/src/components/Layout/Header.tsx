import { TreePine, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-black/80 via-cranberry-dark/40 to-transparent p-4 sm:p-8 border-b border-gold/20"
      style={{ boxShadow: '0 4px 30px rgba(166, 61, 64, 0.2), inset 0 -20px 60px rgba(0,0,0,0.3)' }}>
      {/* Glow effects */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(232, 185, 35, 0.1) 0%, transparent 60%)' }} />

      {/* Sparkle Decoration - fewer on mobile */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-4">
        <Sparkles className="text-gold animate-[twinkle_2s_ease-in-out_infinite]" size={14} style={{ filter: 'drop-shadow(0 0 8px rgba(232, 185, 35, 0.8))' }} />
        <Sparkles className="text-gold animate-[twinkle_2s_ease-in-out_infinite_0.5s] hidden sm:block" size={12} style={{ filter: 'drop-shadow(0 0 8px rgba(232, 185, 35, 0.8))' }} />
        <Sparkles className="text-gold animate-[twinkle_2s_ease-in-out_infinite_1s]" size={14} style={{ filter: 'drop-shadow(0 0 8px rgba(232, 185, 35, 0.8))' }} />
      </div>

      {/* Content */}
      <div className="relative z-[1] max-w-[1200px] mx-auto">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <TreePine className="text-holly hidden sm:block" size={32} style={{ filter: 'drop-shadow(0 0 10px rgba(30, 86, 49, 0.8))' }} />
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-gold via-cream to-gold m-0 font-semibold tracking-wide leading-tight"
              style={{ textShadow: '0 0 30px rgba(232, 185, 35, 0.5)', filter: 'drop-shadow(0 2px 10px rgba(232, 185, 35, 0.3))' }}>
              Atmosphere Holiday Feast
            </h1>
            <p className="text-gold/80 text-xs sm:text-base mt-1 sm:mt-2 italic tracking-wider"
              style={{ textShadow: '0 0 10px rgba(232, 185, 35, 0.3)' }}>
              Plan the perfect holiday gathering
            </p>
          </div>
          <TreePine className="text-holly hidden sm:block" size={32} style={{ filter: 'drop-shadow(0 0 10px rgba(30, 86, 49, 0.8))' }} />
        </div>
      </div>

      {/* Garland Lights - fewer on mobile */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-around px-2 sm:px-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full -translate-y-0.5 animate-[glow_1.5s_ease-in-out_infinite] ${
              i % 3 === 0
                ? 'bg-cranberry shadow-[0_0_10px_theme(colors.cranberry.DEFAULT),0_0_20px_theme(colors.cranberry.DEFAULT)]'
                : i % 2 === 0
                ? 'bg-holly shadow-[0_0_10px_theme(colors.holly.DEFAULT),0_0_20px_theme(colors.holly.DEFAULT)]'
                : 'bg-gold shadow-[0_0_10px_theme(colors.gold.DEFAULT),0_0_20px_theme(colors.gold.DEFAULT)]'
            }`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </header>
  );
}

