import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="font-medium text-snow/80 text-xs sm:text-sm">{label}</label>}
      <textarea
        className={`w-full min-h-[120px] sm:min-h-[150px] p-3 sm:p-4 border rounded-lg bg-black/30 text-snow backdrop-blur-sm resize-y transition-all duration-200 text-base sm:text-sm
          placeholder:text-snow/40
          focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20 focus:bg-black/40
          ${error ? 'border-cranberry' : 'border-white/20'} ${className}`}
        {...props}
      />
      {error && <p className="text-cranberry text-xs sm:text-sm m-0">{error}</p>}
    </div>
  );
}

