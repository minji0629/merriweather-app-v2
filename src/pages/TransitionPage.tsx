import { useEffect, useState } from 'react';
import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';
import { CHAPTER_BG_1 } from '@/constants/images';

export function TransitionPage() {
  const { nickname, setCurrentPage } = useApp();
  const [phase, setPhase] = useState<'darken' | 'chapter'>('darken');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('chapter'), 1500);
    const t2 = setTimeout(() => setCurrentPage('lu'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [setCurrentPage]);

  return (
    <PageContainer className="bg-black" footer={false}>
      {/* Darkening overlay */}
      <div
        className={`absolute inset-0 z-30 bg-black transition-opacity duration-[1500ms] ${
          phase === 'darken' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Chapter 1 background */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-[2000ms] ${
          phase === 'chapter' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <img src={CHAPTER_BG_1} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Content */}
      <div
        className={`relative z-20 flex flex-col items-center justify-center flex-1 min-h-0 px-6 transition-all duration-1000 ${
          phase === 'chapter' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* 상단: CHAPTER 1 (Pretendard, 작게, 자간 넓게) */}
        <p className="font-sans text-xs text-white/80 tracking-[0.3em] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-fadeUp">
          Chapter 1
        </p>
        {/* 중앙: 기억의 숲 입구 (Playfair Display, 크게) */}
        <h2 className="font-playfair text-3xl font-bold text-white tracking-[0.05em] mt-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
          기억의 숲 입구
        </h2>
        {/* 하단: 닉네임님의 여행이 시작됩니다 (Gowun Batang, 작게) */}
        <p className="font-batang text-sm text-white/80 mt-3 animate-fadeUp drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ animationDelay: '0.5s', opacity: 0 }}>
          {nickname}님의 여행이 시작됩니다.
        </p>
        <p className="font-sans mt-8 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-fadeUp" style={{ animationDelay: '0.7s', opacity: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
          잠시 후 자동으로 넘어갑니다.
        </p>
      </div>
    </PageContainer>
  );
}
