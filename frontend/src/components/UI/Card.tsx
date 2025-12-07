import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'festive';
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const baseStyles = 'rounded-xl overflow-hidden backdrop-blur-md bg-black/40 border';
  const variantStyles = variant === 'festive'
    ? 'border-gold/40 shadow-[0_0_30px_rgba(232,185,35,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]'
    : 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]';

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ children, icon, className }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 ${className}`}>
      {icon && (
        <span className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-cranberry to-cranberry-dark rounded-lg text-snow shrink-0"
          style={{ boxShadow: '0 0 20px rgba(166, 61, 64, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
          {icon}
        </span>
      )}
      <h2 className="text-lg sm:text-xl m-0 text-snow" style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>{children}</h2>
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
}

export function CardContent({ children }: CardContentProps) {
  return <div className="p-4 sm:p-6 text-snow/90">{children}</div>;
}

