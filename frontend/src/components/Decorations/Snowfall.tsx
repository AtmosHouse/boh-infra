import { useEffect, useState } from 'react';
import { SnowflakeIcon } from 'lucide-react';

interface SnowflakeData {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
  driftLeft: boolean;
}

export function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<SnowflakeData[]>([]);

  useEffect(() => {
    // Use fewer snowflakes on mobile for better performance
    const isMobile = window.innerWidth < 640;
    const flakeCount = isMobile ? 80 : 250;

    const flakes: SnowflakeData[] = Array.from({ length: flakeCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 10 + Math.random() * 30,
      animationDelay: Math.random() * 10,
      size: isMobile ? 3 + Math.random() * 5 : 4 + Math.random() * 8,
      opacity: 0.3 + Math.random() * 0.5,
      driftLeft: i % 2 === 1,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
      {snowflakes.map((flake) => (
        <SnowflakeIcon
          key={flake.id}
          className={`absolute -top-5 rounded-full text-white shadow-[0_0_6px_rgba(255,255,255,0.5)] ${flake.driftLeft ? 'animate-fall-left' : 'animate-fall'}`}
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
}

