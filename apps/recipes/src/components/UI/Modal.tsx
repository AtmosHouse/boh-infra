import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'max-w-[400px]',
  md: 'max-w-[600px]',
  lg: 'max-w-[800px]',
  xl: 'max-w-[1000px]',
};

// Mobile-first styles
const mobileStyles = `
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <style>{mobileStyles}</style>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]"
        onClick={handleOverlayClick}
      >
        <div className={`w-full ${sizeStyles[size]} max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a0a0a] border border-gold/30 border-b-0 sm:border-b animate-[slideUp_0.3s_ease-out]`}
          style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 60px rgba(166, 61, 64, 0.15), 0 0 100px rgba(232, 185, 35, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 bg-gradient-to-r from-cranberry/20 to-holly/10 sm:rounded-t-2xl">
            <h2 className="m-0 text-lg sm:text-xl font-semibold text-gold flex items-center gap-2 before:content-['🎄']"
              style={{ textShadow: '0 0 10px rgba(232, 185, 35, 0.3)' }}>
              {title}
            </h2>
            <button
              className="bg-white/5 rounded-lg p-2 text-snow/70 border border-white/10 flex items-center justify-center transition-all duration-200 hover:bg-cranberry/30 hover:text-snow hover:border-cranberry/50 active:bg-cranberry/40"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={22} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-snow/90 overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default Modal;

