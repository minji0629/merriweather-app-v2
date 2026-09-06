import { useState } from 'react';
import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';
import { Gift, ArrowRight, Sparkles } from '@/components/Icons';

export function GiftLandingPage() {
  const { setCurrentPage } = useApp();

  const [code] = useState(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  });

  const handleStart = () => {
    setCurrentPage('landing');
  };

  return (
    <PageContainer className="bg-base">
      <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
        <div className="px-6 pt-10 pb-8 min-h-screen flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub hover:text-text transition-colors"
            >
              MERRIWEATHER
            </button>
            <span className="font-sans text-sm text-text-sub">선물</span>
          </div>

          {/* Gift arrival message */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Gift icon with glow */}
            <div className="relative mb-8 animate-fadeUp">
              <div className="absolute inset-0 bg-point/20 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-point-light/40 to-point/20
                              flex items-center justify-center border border-point/20 shadow-lg">
                <Gift className="w-12 h-12 text-point-dark" />
              </div>
            </div>

            {/* Title */}
            <h1 className="font-batang text-3xl text-text mb-4 animate-fadeUp" style={{ animationDelay: '0.15s', opacity: 0 }}>
              선물이 도착했어요
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-sm text-text-sub leading-relaxed mb-10 max-w-xs animate-fadeUp"
               style={{ animationDelay: '0.3s', opacity: 0 }}>
              누군가 당신을 위해 정성껏 준비한<br />
              메리웨더 여행의 초대장이 도착했어요.
            </p>

            {/* Gift code display */}
            {code && (
              <div className="mb-10 animate-fadeUp" style={{ animationDelay: '0.45s', opacity: 0 }}>
                <p className="font-sans text-xs text-text-sub mb-3 tracking-wide">선물 코드</p>
                <div className="px-8 py-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-point/20 shadow-md">
                  <span className="font-sans text-2xl font-bold tracking-[0.3em] text-point-dark">
                    {code}
                  </span>
                </div>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={handleStart}
              className="group flex items-center gap-2 px-8 py-4 bg-point text-white rounded-2xl
                         font-sans font-medium text-base shadow-lg transition-all duration-300
                         hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95
                         animate-fadeUp"
              style={{ animationDelay: '0.6s', opacity: 0 }}
            >
              메리웨더 여행 시작하기
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Guide message */}
            <div className="mt-10 max-w-xs animate-fadeUp" style={{ animationDelay: '0.75s', opacity: 0 }}>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-point" />
                <span className="font-sans text-xs font-medium text-text-sub">선물 코드 사용 안내</span>
              </div>
              <p className="font-sans text-xs text-text-sub leading-relaxed text-center">
                여행을 완료한 후, 결과 페이지 하단의<br />
                <span className="text-point-dark font-medium">[선물 코드 입력하기]</span>에서<br />
                위 코드를 입력하면 탐험권이 활성화돼요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
