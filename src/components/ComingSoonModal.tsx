import { useEffect } from 'react';
import { X } from '@/components/Icons';

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function ComingSoonModal({ open, onClose, message = '준비 중입니다' }: ComingSoonModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative mx-6 w-full max-w-xs bg-white rounded-3xl shadow-2xl p-8 text-center animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F0F0EE] flex items-center justify-center text-text-sub hover:bg-[#E0DDD8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-point/15 flex items-center justify-center">
          <span className="text-2xl font-batang text-point-dark">루</span>
        </div>
        <p className="font-batang text-lg text-text mb-2">{message}</p>
        <p className="font-sans text-sm text-text-sub">곧 만나보실 수 있어요.</p>
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-point text-white rounded-full font-sans font-medium text-sm hover:bg-point-dark transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}
