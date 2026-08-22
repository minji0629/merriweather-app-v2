import { useState } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { PageContainer } from '@/components/PageContainer';
import { RESIDENT_IMAGES } from '@/constants/images';
import { getResidentProfile, withNickname } from '@/constants/residents';
import { Lock, Sparkles, Check, Gift, Ticket } from '@/components/Icons';
import ResidentFlipCard from '@/components/ResidentFlipCard';
import { GiftCodeModal } from '@/components/GiftCodeModal';
import { ShareModal } from '@/components/ShareModal';
import { buildResultShareUrl, SERVICE_URL } from '@/lib/share';

const PREMIUM_SECTIONS = [
  { emoji: '🌿', title: '당신이라는 사람', hint: '당신이 세상을 바라보는 방식의 비밀' },
  { emoji: '✨', title: '당신 안에 흐르는 결', hint: '가장 깊은 곳에 흐르는 당신의 본질' },
  { emoji: '💫', title: '강점이 빛나는 순간', hint: '당신이 가장 빛나는 순간은 언제일까요' },
  { emoji: '🔄', title: '당신이 반복하는 패턴', hint: '알게 모르게 반복해온 나만의 방식' },
  { emoji: '🧭', title: '당신을 움직이는 진짜 이유', hint: '겉으로 드러나지 않았던 나의 진짜 동기' },
  { emoji: '🤝', title: '관계 속의 당신', hint: '사람들 사이에서 당신은 어떤 사람인가요' },
  { emoji: '🌱', title: '당신이 성장하는 방식', hint: '당신만의 방식으로 피어나는 법' },
  { emoji: '🗝️', title: '당신 안에 숨겨진 가능성', hint: '아직 꺼내지 못한 당신의 잠재력' },
];

const PREMIUM_PLUS_SECTIONS = [
  { emoji: '🧭', title: '당신이 함께 걷는 법', hint: '나만을 위해 쓰인 나의 관계 이야기' },
  { emoji: '🌟', title: '당신의 빛을 키우는 방법', hint: '나만을 위해 쓰인 나의 성장 이야기' },
];

export function ResultPage() {
  const { nickname, setCurrentPage, residentKey, selectedResidentKey, selectedResultId, restart, previousPage } = useApp();
  const { user, login } = useAuth();
  const { currentPage } = useApp();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showGiftLogin, setShowGiftLogin] = useState(false);
  const [showGiftCode, setShowGiftCode] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const effectiveKey = selectedResidentKey ?? residentKey;
  const RESULT = effectiveKey ? getResidentProfile(effectiveKey) : null;
  const resultShareUrl = selectedResultId ? buildResultShareUrl(selectedResultId, 'basic') : SERVICE_URL;
  const shareContent = RESULT && effectiveKey ? {
    linkUrl: resultShareUrl,
  } : null;

  if (!RESULT) {
    return (
      <PageContainer className="bg-base">
        <div className="flex items-center justify-center flex-1 min-h-0">
          <p className="font-sans text-sm text-text-sub">결과를 불러오고 있어요...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-base">
      <div className="flex-1">
        <div className="px-6 pt-10 pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 pr-14 sm:pr-0">
            {previousPage === 'archive' ? (
              <button
                onClick={() => setCurrentPage('archive')}
                className="text-sm font-sans text-text-sub hover:text-text transition-colors"
              >
                ← 보관함으로
              </button>
            ) : (
              <span />
            )}
            <p className="font-sans text-xs text-text-sub text-right max-w-[200px] leading-relaxed">
              현재 가오픈 기간으로 공유 기능은 잠시 후 오픈될 예정이에요.
            </p>
          </div>

          {/* Resident card */}
          <div className="flex flex-col items-center mb-8 animate-fadeUp">
            {RESIDENT_IMAGES[effectiveKey!] ? (
              <ResidentFlipCard
                frontImage={RESIDENT_IMAGES[effectiveKey!]}
                alt={RESULT.name}
              />
            ) : (
              <div
                className="relative overflow-hidden flex flex-col items-center justify-center"
                style={{
                  width: '280px',
                  height: '380px',
                  border: '2px solid #C9A84C',
                  borderRadius: '12px',
                  background: '#f5f0e0',
                }}
              >
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-golden/80 rounded-full text-[10px] font-sans text-text">
                  MERRIWEATHER
                </div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-point-light/50 to-point/40 flex items-center justify-center mb-4 shadow-inner">
                  <span className="text-4xl">{RESULT.emoji}</span>
                </div>
                <p className="text-xs font-sans text-text-sub mb-1">주민등록증</p>
                <p className="font-batang text-lg text-text">{RESULT.name}</p>
                <p className="text-[10px] font-sans text-text-sub mt-1">No. {nickname || 'GUEST'}-001</p>
              </div>
            )}
          </div>

          {/* Name + intro */}
          <div className="text-center mb-8 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h1 className="font-batang text-3xl text-text mb-2">{RESULT.name}</h1>
            <p className="font-sans text-sm text-text-sub">{RESULT.intro}</p>
          </div>

          {/* Lu's discoveries */}
          <div className="mb-8 animate-fadeUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <h2 className="font-batang text-lg text-point-dark mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              루가 발견한 것
            </h2>
            <div className="space-y-3">
              {RESULT.discovered.map((item, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-[#E0DDD8]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-point/15 text-point-dark text-xs font-sans font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="font-sans text-sm text-text leading-relaxed">{withNickname(item, nickname)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Representative insight */}
          <div className="mb-8 p-5 bg-gradient-to-br from-golden/30 to-golden/10 rounded-2xl border border-golden/40 animate-fadeUp" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <h3 className="font-batang text-sm text-text-sub mb-2">대표 통찰</h3>
            <p className="font-batang text-lg text-text leading-relaxed">{withNickname(RESULT.insight, nickname)}</p>
          </div>

          {/* Strengths */}
          <div className="mb-8 animate-fadeUp" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <h2 className="font-batang text-lg text-point-dark mb-4">강점</h2>
            <div className="space-y-3">
              {RESULT.strengths.map((s, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-[#E0DDD8]">
                  <Check className="w-5 h-5 text-point flex-shrink-0 mt-0.5" />
                  <p className="font-sans text-sm text-text leading-relaxed">{withNickname(s, nickname)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Misconception */}
          <div className="mb-8 p-5 bg-white rounded-xl border border-[#E0DDD8] animate-fadeUp" style={{ animationDelay: '0.7s', opacity: 0 }}>
            <h2 className="font-batang text-lg text-point-dark mb-3">자주 받는 착각</h2>
            <p className="font-sans text-sm text-text leading-relaxed">{withNickname(RESULT.misconception, nickname)}</p>
          </div>

          {/* Lu's letter preview (locked) */}
          <div className="mb-8 animate-fadeUp" style={{ animationDelay: '0.8s', opacity: 0 }}>
            <h2 className="font-batang text-lg text-point-dark mb-4">루의 편지</h2>
            <div className="p-6 bg-letter rounded-2xl border border-[#E0DDD8] relative overflow-hidden">
              <p className="font-batang text-base text-text leading-relaxed whitespace-pre-line">
                {withNickname(RESULT.letter, nickname)}
              </p>
              {/* Blur overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-letter via-letter/90 to-transparent flex items-end justify-center pb-3">
                <div className="flex items-center gap-1.5 px-4 py-2 bg-white/80 rounded-full text-text-sub text-sm font-sans backdrop-blur-sm">
                  <Lock className="w-3.5 h-3.5" />
                  루가 아직 전하지 못한 이야기가 있어요
                </div>
              </div>
            </div>
          </div>

          {/* Premium content preview */}
          <div className="mb-8 animate-fadeUp" style={{ animationDelay: '0.9s', opacity: 0 }}>
            <p className="font-batang text-sm text-text-sub mb-4 text-center">
              탐험권으로 10가지를 더 알 수 있어요.
            </p>
            <div className="space-y-2.5">
              {PREMIUM_SECTIONS.slice(0, 3).map((s, i) => (
                <div
                  key={i}
                  className="p-4 bg-white rounded-xl border border-[#E0DDD8]"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none flex-shrink-0 mt-0.5">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-batang text-sm text-text">{s.title}</p>
                      <p className="font-sans text-xs text-text-sub mt-1">{s.hint}</p>
                    </div>
                  </div>
                </div>
              ))}
              {previewExpanded && (
                <div className="space-y-2.5 animate-fadeUp">
                  {PREMIUM_SECTIONS.slice(3).map((s, j) => (
                    <div
                      key={j + 3}
                      className="p-4 bg-white rounded-xl border border-[#E0DDD8]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none flex-shrink-0 mt-0.5">{s.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-batang text-sm text-text">{s.title}</p>
                          <p className="font-sans text-xs text-text-sub mt-1">{s.hint}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Divider + Plus sections */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex-1 h-px bg-[#E0DDD8]" />
                      <span className="font-sans text-xs text-golden font-bold whitespace-nowrap">✦ 탐험권 플러스 전용</span>
                      <div className="flex-1 h-px bg-[#E0DDD8]" />
                    </div>
                    {PREMIUM_PLUS_SECTIONS.map((s, k) => (
                      <div
                        key={k}
                        className="mb-2.5 last:mb-0 p-4 bg-gradient-to-br from-golden/10 to-golden/5 rounded-xl border border-golden/30"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg leading-none flex-shrink-0 mt-0.5">{s.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-batang text-sm text-text">{s.title}</p>
                            <p className="font-sans text-xs text-text-sub mt-1">{s.hint}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setPreviewExpanded((v) => !v)}
              className="mt-4 w-full py-3 bg-white border border-[#E0DDD8] rounded-xl font-sans text-sm text-text-sub
                         hover:border-point hover:text-point transition-all duration-300 active:scale-95
                         flex items-center justify-center gap-1.5"
            >
              {previewExpanded ? '접기' : '더 알아보기'}
              <span className="text-xs">{previewExpanded ? '∧' : '∨'}</span>
            </button>
            <p className="font-batang text-sm text-text mt-5 text-center leading-relaxed">
              이 모든 이야기가 지금 당신을 기다리고 있어요.
            </p>
          </div>
        </div>

        {/* Payment buttons */}
        <div className="px-6 pb-6 space-y-3 pt-4 border-t border-[#E0DDD8]">
          {!user && (
            <div className="rounded-2xl bg-[#FFF8E7] border border-[#E5D9B6] px-4 py-3">
              <p className="font-sans text-xs text-text-sub leading-relaxed text-center">
                메리웨더 주민이 되면 결과를 보관함에 저장하고 언제든 다시 볼 수 있어요.
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (!user) {
                setShowSavePrompt(true);
              } else {
                setCurrentPage('payment');
              }
            }}
            className="w-full py-4 bg-point text-white rounded-2xl font-sans font-medium text-base
                       shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95
                       flex items-center justify-between px-6"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              탐험권 구매하기
            </span>
            <span className="font-bold">4,990원</span>
          </button>
          <div className="relative">
            <button
              onClick={() => {
                if (!user) {
                  setShowSavePrompt(true);
                } else {
                  setCurrentPage('payment');
                }
              }}
              className="w-full py-4 bg-text text-white rounded-2xl font-sans font-medium text-base
                         shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-95
                         flex items-center justify-between px-6"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                탐험권 플러스
              </span>
              <span className="font-bold">6,980원</span>
            </button>
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-golden text-text text-xs font-sans font-bold rounded-full shadow-md whitespace-nowrap">
              추천
            </span>
          </div>
        </div>

        {/* Save result prompt (login required) */}
        {showSavePrompt && !user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSavePrompt(false)} />
            <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6 text-center">
              <h2 className="font-batang text-xl text-text mb-2">탐험권 구매를 위해 주민 인증이 필요해요</h2>
              <p className="font-sans text-sm text-text-sub mb-6">
                메리웨더 주민이 되면 결과를 저장하고 언제든 다시 볼 수 있어요.
              </p>
              <button
                onClick={() => {
                  setShowSavePrompt(false);
                  login(currentPage);
                }}
                className="w-full py-4 bg-[#FEE500] text-[#3C1E1E] rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95"
              >
                메리웨더 주민 되기
              </button>
            </div>
          </div>
        )}

        {/* Gift button */}
        <div className="px-6 pb-4 space-y-3">
          <button
            onClick={() => {
              if (!user) {
                setShowGiftLogin(true);
              } else {
                setCurrentPage('gift');
              }
            }}
            className="w-full py-3.5 bg-white text-point-dark rounded-2xl font-sans font-medium text-sm
                       border border-point shadow-sm transition-all duration-300 hover:bg-point/5 hover:shadow-md active:scale-95
                       flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            소중한 사람에게 선물하기
          </button>
          <button
            onClick={() => setShowGiftCode(true)}
            className="w-full py-3.5 bg-point/10 text-point-dark rounded-2xl font-sans font-medium text-sm
                       border border-point/30 transition-all duration-300 hover:bg-point/15 hover:shadow-md active:scale-95
                       flex items-center justify-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            선물 코드 입력하기
          </button>
        </div>

        {/* Gift login prompt (login required) */}
        {showGiftLogin && !user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGiftLogin(false)} />
            <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6 text-center">
              <h2 className="font-batang text-xl text-text mb-2">선물하기를 위해 주민 인증이 필요해요</h2>
              <p className="font-sans text-sm text-text-sub mb-6">
                메리웨더 주민이 되면 소중한 사람에게 탐험권을 선물할 수 있어요.
              </p>
              <button
                onClick={() => {
                  setShowGiftLogin(false);
                  login(currentPage);
                }}
                className="w-full py-4 bg-[#FEE500] text-[#3C1E1E] rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95"
              >
                메리웨더 주민 되기
              </button>
            </div>
          </div>
        )}

        {showGiftCode && <GiftCodeModal onClose={() => setShowGiftCode(false)} />}

        {/* Restart link */}
        <div className="px-6 pb-8 text-center">
          <button
            onClick={restart}
            className="font-sans text-sm text-text-sub hover:text-text transition-colors underline-offset-4 hover:underline"
          >
            다시 여행하기
          </button>
        </div>
      </div>

      {shareContent && (
        <ShareModal
          open={showShareModal}
          content={shareContent}
          cardImage={effectiveKey ? RESIDENT_IMAGES[effectiveKey] : undefined}
          cardName={RESULT?.name}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </PageContainer>
  );
}
