import { useEffect } from 'react';
import { Check, Share2, X } from '@/components/Icons';

interface PremiumShareChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (includeFullContent: boolean) => void;
}

export function PremiumShareChoiceModal({ open, onClose, onSelect }: PremiumShareChoiceModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="relative mx-4 mb-4 sm:mb-0 w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn" onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F0F0EE] flex items-center justify-center text-text-sub hover:bg-[#E0DDD8] transition-colors" aria-label="공유 선택 모달 닫기">
          <X className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-point/15 flex items-center justify-center">
          <Share2 className="w-7 h-7 text-point-dark" />
        </div>
        <h2 className="font-batang text-xl text-text text-center mb-1">무엇을 공유할까요?</h2>
        <p className="font-sans text-sm text-text-sub text-center mb-5">공유할 결과의 범위를 선택해줘.</p>

        <div className="space-y-3">
          <button onClick={() => onSelect(false)} className="w-full p-4 rounded-2xl bg-base border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors">
            <span className="flex items-center gap-2 font-sans text-sm font-medium text-text"><Check className="w-4 h-4 text-point" /> 기본 공유</span>
            <span className="block mt-1 pl-6 font-sans text-xs text-text-sub">주민 카드 이미지, 주민 이름, 한 줄 소개</span>
          </button>
          <button onClick={() => onSelect(true)} className="w-full p-4 rounded-2xl bg-point text-white text-left hover:bg-point-dark transition-colors">
            <span className="flex items-center gap-2 font-sans text-sm font-medium"><Share2 className="w-4 h-4" /> 전체 공유</span>
            <span className="block mt-1 pl-6 font-sans text-xs text-white/75">루에게 질문하기를 제외한 모든 결과 내용</span>
          </button>
        </div>
      </div>
    </div>
  );
}
