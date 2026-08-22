import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { PageContainer } from '@/components/PageContainer';
import { RESIDENT_IMAGES } from '@/constants/images';
import { getResidentProfile } from '@/constants/residents';
import { Check, Clock, Sparkles } from '@/components/Icons';
import { TermsAgreement } from '@/components/TermsAgreement';
import { requestPayment, ProductId } from '@/lib/portone';

export function PaymentPage() {
  const { nickname, setCurrentPage, residentKey } = useApp();
  const PREVIEW = residentKey ? getResidentProfile(residentKey) : null;
  const { user, login } = useAuth();
  const { currentPage } = useApp();
  const [selected, setSelected] = useState<ProductId>('expedition_plus');
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const payingRef = useRef(false);
  useEffect(() => { payingRef.current = paying; }, [paying]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && payingRef.current) {
        setPaying(false);
        setError('결제가 취소되었습니다.');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handlePay = async () => {
    if (!agreed) return;
    if (!user) {
      await login(currentPage);
      return;
    }
    setPaying(true);
    setError('');
    try {
      await requestPayment(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제 중 오류가 발생했어요.');
      setPaying(false);
    }
  };

  return (
    <PageContainer className="bg-base">
      <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
        <div className="px-6 pt-10 pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub hover:text-text transition-colors"
            >
              MERRIWEATHER
            </button>
            <span className="font-sans text-sm text-text-sub">결제</span>
          </div>

          {/* Resident card preview */}
          <div className="flex flex-col items-center mb-8 animate-fadeUp">
            <div className="w-32 h-40 rounded-2xl bg-gradient-to-b from-letter to-[#EDE5D0] shadow-md border border-[#E0DDD8] flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {residentKey && RESIDENT_IMAGES[residentKey] ? (
                <img src={RESIDENT_IMAGES[residentKey]} alt={PREVIEW?.name ?? '주민 카드'} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-b from-point-light/50 to-point/40 flex items-center justify-center mb-2 shadow-inner">
                    <span className="text-xl font-batang text-point-dark">{PREVIEW?.emoji ?? '🦉'}</span>
                  </div>
                  <p className="text-[9px] font-sans text-text-sub">주민등록증</p>
                  <p className="font-batang text-xs text-text">{PREVIEW?.name ?? '조용한 파수꾼'}</p>
                  <p className="text-[8px] font-sans text-text-sub mt-0.5">No. {nickname || 'GUEST'}-001</p>
                </>
              )}
            </div>
          </div>

          <h2 className="font-batang text-xl text-text text-center mb-6 animate-fadeUp" style={{ animationDelay: '0.15s', opacity: 0 }}>
            탐험권을 선택해주세요
          </h2>

          {/* Option 1 */}
          <div
            onClick={() => setSelected('expedition')}
            className={`mb-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 animate-fadeUp
                        ${selected === 'expedition'
                          ? 'bg-white border-[1.5px] border-point shadow-lg'
                          : 'bg-white border border-[#E0DDD8]'
                        }`}
            style={{ animationDelay: '0.3s', opacity: 0 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                              ${selected === 'expedition' ? 'border-point bg-point' : 'border-[#E0DDD8]'}`}
                >
                  {selected === 'expedition' && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-sans font-medium text-text">탐험권</span>
              </div>
              <div className="text-right">
                <p className="font-sans font-bold text-lg text-text">4,990원</p>
                <p className="font-sans text-xs text-text-sub line-through">8,900원</p>
              </div>
            </div>
            <div className="mt-4 ml-7 space-y-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-point-dark">✦</span>
                  <span className="font-sans font-medium text-sm text-text">나만을 위한 8가지 심층 분석</span>
                </div>
                <p className="font-sans text-xs text-text-sub ml-5 mt-0.5 leading-relaxed">
                  당신이라는 사람 / 강점이 빛나는 순간 /<br />당신이 반복하는 패턴 / 당신을 움직이는 진짜 이유 /<br />관계 속의 당신 / 당신이 성장하는 방식 /<br />당신 안에 숨겨진 가능성 / 당신 안에 흐르는 결
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-point-dark">✦</span>
                  <span className="font-sans font-medium text-sm text-text">나에게 맞춰 쓰인 루의 편지</span>
                </div>
                <p className="font-sans text-xs text-text-sub ml-5 mt-0.5">나의 결과를 바탕으로 루가 직접 써준 편지</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-point-dark">✦</span>
                  <span className="font-sans font-medium text-sm text-text">루에게 질문 1회</span>
                </div>
                <p className="font-sans text-xs text-text-sub ml-5 mt-0.5">결과에 대해 루에게 직접 물어볼 수 있어요</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-point-dark">✦</span>
                  <span className="font-sans font-medium text-sm text-text">결과 영구 저장</span>
                </div>
                <p className="font-sans text-xs text-text-sub ml-5 mt-0.5">언제든 보관함에서 다시 확인 가능</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-point-dark">✦</span>
                  <span className="font-sans font-medium text-sm text-text">다음 시즌 예고</span>
                </div>
                <p className="font-sans text-xs text-text-sub ml-5 mt-0.5">메리웨더의 새로운 여행을 가장 먼저 만나요</p>
              </div>
            </div>
            <div className="mt-3 ml-7 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-point" />
              <p className="font-sans text-xs text-point-dark">✨ 오픈 한정 특별 할인가</p>
            </div>
            <p className="mt-3 ml-7 font-sans text-xs text-point-dark font-medium">결제 완료 후 즉시 이용 가능합니다</p>
          </div>

          {/* Option 2 */}
          <div
            onClick={() => setSelected('expedition_plus')}
            className={`mb-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 animate-fadeUp relative
                        ${selected === 'expedition_plus'
                          ? 'bg-white border-[1.5px] border-point shadow-lg'
                          : 'bg-white border border-[#E0DDD8]'
                        }`}
            style={{ animationDelay: '0.4s', opacity: 0 }}
          >
            <span className="absolute -top-2.5 right-5 px-3 py-0.5 bg-point text-white text-xs font-sans font-bold rounded-full shadow-md">
              추천
            </span>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                              ${selected === 'expedition_plus' ? 'border-point bg-point' : 'border-[#E0DDD8]'}`}
                >
                  {selected === 'expedition_plus' && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-sans font-medium text-text">탐험권 플러스</span>
              </div>
              <div className="text-right">
                <p className="font-sans font-bold text-lg text-text">6,980원</p>
                <p className="font-sans text-xs text-text-sub line-through">10,890원</p>
              </div>
            </div>
            <div className="mt-4 ml-7 space-y-3">
              <p className="font-sans text-xs text-text-sub">위 탐험권 혜택 모두 포함</p>
              <div>
                <p className="font-sans font-medium text-sm text-point-dark mb-2">✨ 오직 나를 위한 메리웨더의 선물</p>
                <div className="flex items-start gap-1.5">
                  <span className="text-point-dark mt-0.5">✦</span>
                  <div>
                    <span className="font-sans font-medium text-sm text-text">당신이 함께 걷는 법</span>
                    <p className="font-sans text-xs text-text-sub mt-0.5 leading-relaxed">나의 여정을 바탕으로 숲이 직접 써준 나만의 관계 이야기</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 mt-2">
                  <span className="text-point-dark mt-0.5">✦</span>
                  <div>
                    <span className="font-sans font-medium text-sm text-text">당신의 빛을 키우는 방법</span>
                    <p className="font-sans text-xs text-text-sub mt-0.5 leading-relaxed">나의 여정을 바탕으로 숲이 직접 써준 나만의 성장 이야기</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-point-dark">✦</span>
                  <span className="font-sans font-medium text-sm text-text">루에게 질문 3회 (기본 1회 + 추가 2회)</span>
                </div>
                <p className="font-sans text-xs text-text-sub ml-5 mt-0.5">결과에 대해 루에게 더 깊이 물어볼 수 있어요</p>
              </div>
            </div>
            <div className="mt-3 ml-7 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-point" />
              <p className="font-sans text-xs text-point-dark">✨ 오픈 한정 특별 할인가</p>
            </div>
          </div>

          {/* Terms agreement */}
          <div className="mb-6 animate-fadeUp" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <TermsAgreement agreed={agreed} onChange={setAgreed} />
          </div>

          {/* Login notice */}
          {!user && (
            <div className="mb-6 p-4 bg-[#FFF8E1] rounded-xl border border-[#FFE082] animate-fadeUp" style={{ animationDelay: '0.55s', opacity: 0 }}>
              <p className="font-sans text-sm text-text mb-2">결제하려면 로그인이 필요해요.</p>
              <button
                onClick={() => login(currentPage)}
                className="font-sans text-sm text-point-dark underline hover:text-point transition-colors"
              >
                메리웨더 주민 되기
              </button>
            </div>
          )}
        </div>

        {/* Bottom: pay button + notice */}
        <div className="px-6 pb-8 sticky bottom-0 bg-base/95 backdrop-blur-sm pt-4 border-t border-[#E0DDD8]">
          {error && (
            <p className="font-sans text-xs text-red-500 text-center mb-3">{error}</p>
          )}
          <button
            onClick={handlePay}
            disabled={!agreed || paying}
            className="w-full py-5 bg-point text-white rounded-2xl font-sans font-bold text-lg
                       shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {paying ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                결제 중...
              </span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                결제하기
              </>
            )}
          </button>
          <p className="mt-4 text-center font-sans text-sm text-text-sub">
            결제 후 즉시 전체 결과를 확인할 수 있어요.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
