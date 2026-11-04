import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="font-medium text-snow/80 text-xs sm:text-sm">{label}</label>}
      <input
        className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg bg-black/30 text-snow backdrop-blur-sm transition-all duration-200 text-base sm:text-sm
          placeholder:text-snow/40
          focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 focus:bg-black/40
          ${error ? 'border-cranberry' : 'border-white/20'} ${className}`}
        {...props}
      />
      {error && <p className="text-cranberry text-xs sm:text-sm m-0">{error}</p>}
    </div>
  );
}

