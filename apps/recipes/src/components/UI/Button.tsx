import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles = {
  primary: 'bg-gradient-to-br from-cranberry to-cranberry-dark text-snow border border-cranberry/50 shadow-[0_0_15px_rgba(166,61,64,0.3)] hover:shadow-[0_0_25px_rgba(166,61,64,0.5)] hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-gradient-to-br from-holly to-holly-dark text-snow border border-holly/50 shadow-[0_0_15px_rgba(30,86,49,0.3)] hover:shadow-[0_0_25px_rgba(30,86,49,0.5)] hover:-translate-y-0.5 active:translate-y-0',
  outline: 'bg-white/5 text-gold border border-gold/40 hover:bg-gold/20 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(232,185,35,0.3)]',
  danger: 'bg-gradient-to-br from-red-600 to-red-800 text-snow border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] hover:-translate-y-0.5 active:translate-y-0',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs sm:text-sm',
  md: 'px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base',
  lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : icon ? (
        <span className="flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}

