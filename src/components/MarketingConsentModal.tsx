import { useState } from 'react';
import { useAuth } from '@/store/useAuth';
import { Check, X } from '@/components/Icons';

export function MarketingConsentModal() {
  const { isMarketingOpen, hideMarketing, saveMarketingConsent } = useAuth();
  const [kakao, setKakao] = useState(false);
  const [email, setEmail] = useState(false);

  if (!isMarketingOpen) return null;

  const handleConfirm = () => {
    saveMarketingConsent({ kakao, email });
    hideMarketing();
  };

  const handleSkip = () => {
    saveMarketingConsent({ kakao: false, email: false });
    hideMarketing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-text-sub hover:text-text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="font-batang text-xl text-text mb-2">마케팅 수신 동의</h2>
        <p className="font-sans text-sm text-text-sub mb-6">
          메리웨더의 새로운 소식을 받아보실 수 있어요.
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setKakao((v) => !v)}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E0DDD8] hover:border-point transition-all"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${kakao ? 'border-point bg-point' : 'border-[#C8C4BE]'}`}
            >
              {kakao && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-sans text-sm text-text">카카오 알림톡 수신 동의 (선택)</span>
          </button>

          <button
            onClick={() => setEmail((v) => !v)}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E0DDD8] hover:border-point transition-all"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${email ? 'border-point bg-point' : 'border-[#C8C4BE]'}`}
            >
              {email && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-sans text-sm text-text">이메일 수신 동의 (선택)</span>
          </button>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-4 bg-point text-white rounded-2xl font-sans font-medium text-base
                     shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl active:scale-95"
        >
          확인
        </button>
        <button
          onClick={handleSkip}
          className="w-full mt-2 py-3 font-sans text-sm text-text-sub hover:text-text transition-colors"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
}
