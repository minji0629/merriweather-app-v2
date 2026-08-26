import { useState, useEffect } from 'react';
import { X, Check, Clock, Sparkles } from '@/components/Icons';
import { TermsAgreement } from '@/components/TermsAgreement';
import { requestPayment } from '@/lib/portone';

interface ExtraQuestionsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExtraQuestionsModal({ open, onClose }: ExtraQuestionsModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

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

  const handlePay = async () => {
    if (!agreed) return;
    setPaying(true);
    setError('');
    try {
      await requestPayment('extra_questions');
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제 중 오류가 발생했어요.');
      setPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative mx-6 w-full max-w-xs bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F0F0EE] flex items-center justify-center text-text-sub hover:bg-[#E0DDD8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-point/15 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-point-dark" />
        </div>

        <h2 className="font-batang text-xl text-text text-center mb-2">추가 질문 3회</h2>
        <p className="font-sans text-sm text-text-sub text-center mb-5">
          루에게 3번 더 질문할 수 있어요.
        </p>

        <div className="p-4 bg-base rounded-2xl border border-[#E0DDD8] mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-point" />
              <span className="font-sans font-medium text-text">추가 질문 3회</span>
            </div>
            <div className="text-right">
              <span className="font-sans font-bold text-lg text-text">1,990원</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-point" />
            <p className="font-sans text-xs text-point-dark">탐험권 구매자 전용</p>
          </div>
        </div>

        <div className="mb-5">
          <TermsAgreement agreed={agreed} onChange={setAgreed} />
        </div>

        {error && (
          <p className="font-sans text-xs text-red-500 text-center mb-3">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={!agreed || paying}
          className="w-full py-4 bg-point text-white rounded-2xl font-sans font-medium text-base
                     shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl active:scale-95
                     disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {paying ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              결제 중...
            </span>
          ) : (
            '결제하기'
          )}
        </button>
      </div>
    </div>
  );
}
