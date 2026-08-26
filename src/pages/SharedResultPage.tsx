import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { RESIDENT_IMAGES } from '@/constants/images';
import { getResidentProfile, withNickname } from '@/constants/residents';
import type { ResidentKey } from '@/constants/questions';
import { fetchResultById, ResultRow } from '@/lib/supabase';
import { Sparkles, Lock, Share2 } from '@/components/Icons';
import ResidentFlipCard from '@/components/ResidentFlipCard';
import { ShareModal } from '@/components/ShareModal';
import { buildResultShareUrl, ShareContent } from '@/lib/share';
import { useApp } from '@/store/useApp';

interface SharedResultPageProps {
  resultId: string;
}

export function SharedResultPage({ resultId }: SharedResultPageProps) {
  const { setCurrentPage, sharedResultScope } = useApp();
  const [result, setResult] = useState<ResultRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const row = await fetchResultById(resultId);
      if (cancelled) return;
      if (!row) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setResult(row);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [resultId]);

  if (loading) {
    return (
      <PageContainer className="bg-base">
        <div className="flex items-center justify-center flex-1 min-h-0">
          <div className="flex items-center gap-2 text-point-dark">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="font-sans text-sm">결과를 불러오는 중...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (notFound || !result) {
    return (
      <PageContainer className="bg-base">
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-point/15 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-point" />
          </div>
          <h1 className="font-batang text-2xl text-text mb-3">결과를 찾을 수 없어요.</h1>
          <p className="font-sans text-sm text-text-sub mb-8">
            공유 링크가 만료되었거나 존재하지 않아요.
          </p>
          <button
            onClick={() => setCurrentPage('landing')}
            className="px-8 py-4 bg-point text-white rounded-2xl font-sans font-bold text-base
                       shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl active:scale-95"
          >
            새로운 여행 시작하기
          </button>
        </div>
      </PageContainer>
    );
  }

  const effectiveKey = result.resident_key as ResidentKey;
  const RESULT = getResidentProfile(effectiveKey);
  if (!RESULT) {
    return (
      <PageContainer className="bg-base">
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-6 text-center">
          <h1 className="font-batang text-2xl text-text mb-3">결과를 표시할 수 없어요.</h1>
          <button
            onClick={() => setCurrentPage('landing')}
            className="px-8 py-4 bg-point text-white rounded-2xl font-sans font-bold text-base
                       shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl active:scale-95"
          >
            새로운 여행 시작하기
          </button>
        </div>
      </PageContainer>
    );
  }

  const requestedScope = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('share') === 'full'
    ? 'full'
    : sharedResultScope === 'full'
      ? 'full'
      : 'basic';
  const showFull = requestedScope === 'full';
  const shareUrl = buildResultShareUrl(resultId, requestedScope);
  const shareContent: ShareContent = {
    linkUrl: shareUrl,
  };

  const isPlusResult = result.product_type === 'expedition_plus' || result.product_type === '탐험권+추가질문';

  // 전체 공유(full)이고 유료 결과일 때만: 루에게 질문하기 제외한 모든 섹션
  const premiumSections = showFull
    ? RESULT.premium.filter((s) => s.title !== '루에게 질문하기')
    : [];

  // 탐험권 플러스 구매자의 전체 공유에만 추가되는 AI 섹션
  const plusExtraSections = showFull && isPlusResult
    ? [
        { title: '당신이 함께 걷는 법', body: result.ai_relation ?? '' },
        { title: '당신의 빛을 키우는 방법', body: result.ai_growth ?? '' },
      ].filter((s) => s.body)
    : [];

  return (
    <PageContainer className="bg-base">
      <div className="overflow-y-auto scrollbar-hide smooth-scroll flex-1 min-h-0">
        <div className="px-6 pt-10 pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 pr-14 sm:pr-0">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub hover:text-text transition-colors"
            >
              MERRIWEATHER
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-sans text-text-sub rounded-full bg-white border border-[#E0DDD8] hover:border-point hover:text-point transition-all duration-300"
            >
              <Share2 className="w-3.5 h-3.5" />
              공유하기
            </button>
          </div>

          {/* Resident card */}
          <div className="flex flex-col items-center mb-8 animate-fadeUp">
            {RESIDENT_IMAGES[effectiveKey] ? (
              <ResidentFlipCard frontImage={RESIDENT_IMAGES[effectiveKey]} alt={RESULT.name} />
            ) : (
              <div
                className="relative overflow-hidden flex flex-col items-center justify-center"
                style={{ width: '280px', height: '380px', border: '2px solid #C9A84C', borderRadius: '12px', background: '#f5f0e0' }}
              >
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-golden/80 rounded-full text-[10px] font-sans text-text">
                  MERRIWEATHER
                </div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-point-light/50 to-point/40 flex items-center justify-center mb-4 shadow-inner">
                  <span className="text-4xl">{RESULT.emoji}</span>
                </div>
                <p className="text-xs font-sans text-text-sub mb-1">주민등록증</p>
                <p className="font-batang text-lg text-text">{RESULT.name}</p>
              </div>
            )}
          </div>

          {/* Name + intro */}
          <div className="text-center mb-8 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h1 className="font-batang text-3xl text-text mb-2">{RESULT.name}</h1>
            <p className="font-sans text-sm text-text-sub">{RESULT.intro}</p>
          </div>

          {/* 전체 공유(full)일 때만 프리미엄 섹션 표시 (루에게 질문하기 제외) */}
          {showFull && (
            <div className="space-y-6">
              {premiumSections.map((section, i) => {
                const delay = 0.3 + i * 0.08;
                let body: string;
                if (section.title === '당신 안에 흐르는 결') {
                  body = result.ai_result ?? withNickname(section.body, '여행자');
                } else if (section.title === '루의 편지') {
                  body = result.ai_letter ?? withNickname(section.body, '여행자');
                } else {
                  body = withNickname(section.body, '여행자');
                }
                return (
                  <div
                    key={i}
                    className="animate-fadeUp"
                    style={{ animationDelay: `${delay}s`, opacity: 0 }}
                  >
                    <h2 className="font-batang text-lg text-point-dark mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {section.title}
                    </h2>
                    <div className="p-5 bg-white rounded-2xl border border-[#E0DDD8]">
                      <p className="font-batang text-sm text-text leading-loose whitespace-pre-line">
                        {body}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* 탐험권 플러스 구매자 전체 공유 시 추가 AI 섹션 */}
              {plusExtraSections.map((section, j) => {
                const delay = 0.3 + (premiumSections.length + j) * 0.08;
                return (
                  <div
                    key={`plus-${j}`}
                    className="animate-fadeUp"
                    style={{ animationDelay: `${delay}s`, opacity: 0 }}
                  >
                    <h2 className="font-batang text-lg text-point-dark mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {section.title}
                    </h2>
                    <div className="p-5 bg-white rounded-2xl border border-[#E0DDD8]">
                      <p className="font-batang text-sm text-text leading-loose whitespace-pre-line">
                        {section.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="px-6 pb-8 text-center animate-fadeUp" style={{ animationDelay: showFull ? '1.2s' : '0.6s', opacity: 0 }}>
            <p className="font-batang text-base text-text mb-4">
              나의 여행도 시작해볼까요?
            </p>
            <button
              onClick={() => setCurrentPage('landing')}
              className="w-full py-4 bg-point text-white rounded-2xl font-sans font-bold text-base
                         shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              나의 주민 만나기
            </button>
          </div>
        </div>
      </div>

      <ShareModal
        open={showShareModal}
        content={shareContent}
        onClose={() => setShowShareModal(false)}
      />
    </PageContainer>
  );
}
