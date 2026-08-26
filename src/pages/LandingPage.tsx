import { useEffect } from 'react';
import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';
import { LANDING_BG, RESIDENT_IMAGES } from '@/constants/images';
import { ArrowRight } from '@/components/Icons';

export function LandingPage() {
  const { setCurrentPage, resetAnswers, setResidentKey, setSecondResidentKey } = useApp();

  useEffect(() => {
    const images = Object.values(RESIDENT_IMAGES).filter(Boolean);
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="relative w-full max-w-mobile mx-auto overflow-x-hidden bg-base">
      {/* Hero — fixed 100vh with background image */}
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={LANDING_BG}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center h-screen px-6 pt-16 pb-12">
          {/* Logo */}
          <div className="flex flex-col items-center w-full animate-fadeIn drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" style={{ transform: 'translate(-8px, -12px)' }}>
            <div className="inline-flex flex-col items-start" style={{ width: 'fit-content' }}>
              <span className="font-imperial text-white tracking-wide leading-none" style={{ fontSize: '4rem', WebkitTextStroke: '0.8px white' }}>Merri</span>
              <span className="font-imperial text-white tracking-wide leading-none" style={{ marginLeft: '0.65em', fontSize: '4rem', WebkitTextStroke: '0.8px white', marginTop: '-0.1em' }}>Weather</span>
            </div>
            <p className="font-sans text-white/90 text-xs tracking-[0.25em] mt-3 text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ marginLeft: '4px' }}>나를 찾아 떠나는 여행</p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* CTA Button */}
          <button
            onClick={() => {
              resetAnswers();
              setResidentKey(null);
              setSecondResidentKey(null);
              setCurrentPage('nickname');
            }}
            className="group flex items-center gap-2 px-8 py-4 bg-white/95 text-text rounded-full font-sans font-medium text-base
                       shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-xl
                       hover:scale-105 active:scale-95 animate-fadeUp"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            여행 시작하기
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Business info — below the hero */}
      <div className="relative z-10 w-full bg-black px-6 py-10 animate-fadeUp"
           style={{ animationDelay: '0.9s', opacity: 0 }}>
        <div className="max-w-[340px] mx-auto text-[10px] leading-[1.8] text-white/80 font-sans space-y-0.5">
          <p>상호명: 릴 스튜디오 | 대표: 황민지</p>
          <p>사업자등록번호: 497-10-03495</p>
          <p>주소: 경상남도 창원시 마산회원구 회성동 6길 14</p>
          <p>이메일: merriweather.official@gmail.com</p>
          <p>통신판매업 신고번호: 2026-마산회원-0219 | 대표전화: 050-6345-9540</p>
        </div>

        <div className="max-w-[340px] mx-auto">
          <div className="flex gap-3 text-[10px] text-white/80 pt-3">
            <button onClick={() => setCurrentPage('terms')} className="underline hover:text-white transition-colors">
              이용약관
            </button>
            <span className="text-white/30">|</span>
            <button onClick={() => setCurrentPage('privacy')} className="underline hover:text-white transition-colors">
              개인정보처리방침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
