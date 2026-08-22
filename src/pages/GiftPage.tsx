import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { PageContainer } from '@/components/PageContainer';
import { Gift, Check, Sparkles, MessageCircle, Link2 } from '@/components/Icons';
import { TermsAgreement } from '@/components/TermsAgreement';
import { requestPayment, ProductId } from '@/lib/portone';
import { saveGiftInfo } from '@/lib/authStorage';

export function GiftPage() {
  const { setCurrentPage } = useApp();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<ProductId>('gift_basic');
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
    if (!recipient.trim() || !agreed) return;
    setPaying(true);
    setError('');
    saveGiftInfo({ recipient: recipient.trim(), message: message.trim() });
    try {
      await requestPayment(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제 중 오류가 발생했어요.');
      setPaying(false);
    }
  };

  return (
    <PageContainer className="bg-purple-bg">
      <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
        <div className="px-6 pt-10 pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub hover:text-text transition-colors"
            >
              MERRIWEATHER
            </button>
            <span className="font-sans text-sm text-text-sub">선물하기</span>
          </div>

          {/* Gift icon + title */}
          <div className="text-center mb-8 animate-fadeUp">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-point/15 flex items-center justify-center">
              <Gift className="w-8 h-8 text-point-dark" />
            </div>
            <h1 className="font-batang text-2xl text-text leading-relaxed">
              소중한 사람에게<br />메리웨더를 선물하세요.
            </h1>
          </div>

          {/* Form */}
          <div className="space-y-5 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            {/* Recipient name */}
            <div>
              <label className="block font-sans text-sm font-medium text-text mb-2">받는 사람 이름</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="받는 분의 이름을 입력해주세요"
                maxLength={12}
                className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm rounded-2xl font-sans text-base text-text
                           placeholder:text-text-sub/50 border border-white/60 shadow-sm
                           focus:bg-white focus:border-point focus:shadow-md transition-all duration-300"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block font-sans text-sm font-medium text-text mb-2">
                메시지 <span className="text-text-sub font-normal">({message.length}/100)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 100))}
                placeholder="함께 나누고 싶은 말을 적어주세요."
                maxLength={100}
                rows={4}
                className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm rounded-2xl font-sans text-sm text-text
                           placeholder:text-text-sub/50 border border-white/60 shadow-sm resize-none
                           focus:bg-white focus:border-point focus:shadow-md transition-all duration-300"
              />
            </div>
          </div>

          {/* Product selection */}
          <div className="mt-6 space-y-4 animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <h2 className="font-sans text-sm font-medium text-text">선물 옵션 선택</h2>

            {/* Gift option 1 */}
            <div
              onClick={() => setSelected('gift_basic')}
              className={`p-5 rounded-2xl cursor-pointer transition-all duration-300
                          ${selected === 'gift_basic'
                            ? 'bg-white border-[1.5px] border-point shadow-lg'
                            : 'bg-white/70 border border-white/60'
                          }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                ${selected === 'gift_basic' ? 'border-point bg-point' : 'border-[#E0DDD8]'}`}
                  >
                    {selected === 'gift_basic' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-sans font-medium text-text">탐험권</span>
                </div>
                <span className="font-sans font-bold text-lg text-text">4,990원</span>
              </div>
              <p className="font-sans text-sm text-text-sub ml-7">전체 결과 10개 섹션 + 루의 편지</p>
            </div>

            {/* Gift option 2 */}
            <div
              onClick={() => setSelected('gift_plus')}
              className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 relative
                          ${selected === 'gift_plus'
                            ? 'bg-white border-[1.5px] border-point shadow-lg'
                            : 'bg-white/70 border border-white/60'
                          }`}
            >
              <span className="absolute -top-2.5 right-5 px-3 py-0.5 bg-point text-white text-xs font-sans font-bold rounded-full shadow-md">
                추천
              </span>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                ${selected === 'gift_plus' ? 'border-point bg-point' : 'border-[#E0DDD8]'}`}
                  >
                    {selected === 'gift_plus' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-sans font-medium text-text">탐험권 + 추가 질문 2회</span>
                </div>
                <span className="font-sans font-bold text-lg text-text">6,980원</span>
              </div>
              <p className="font-sans text-sm text-text-sub ml-7">전체 결과 + 루에게 추가 질문 2회</p>
            </div>
          </div>

          {/* Terms agreement */}
          <div className="mt-6 mb-6 animate-fadeUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <TermsAgreement agreed={agreed} onChange={setAgreed} />
          </div>
        </div>

        {/* Bottom: pay button */}
        <div className="px-6 pb-8 sticky bottom-0 bg-purple-bg/95 backdrop-blur-sm pt-4 border-t border-white/40">
          {error && (
            <p className="font-sans text-xs text-red-500 text-center mb-3">{error}</p>
          )}
          <button
            onClick={handlePay}
            disabled={!recipient.trim() || !agreed || paying}
            className="w-full py-4 bg-point text-white rounded-2xl font-sans font-medium text-base
                       shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {paying ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                결제 중...
              </span>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                선물하기
              </>
            )}
          </button>

          {/* Share options */}
          <div className="mt-6">
            <p className="font-sans text-sm text-text-sub text-center mb-4">결제 후 공유할 수 있어요</p>
            <div className="flex gap-3">
              <button
                onClick={() => setError('결제 후 이용할 수 있어요.')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/70 rounded-xl font-sans text-sm text-text
                           border border-white/60 hover:bg-white hover:border-point transition-all duration-300"
              >
                <MessageCircle className="w-4 h-4 text-point-dark" />
                카카오톡
              </button>
              <button
                onClick={() => setError('결제 후 이용할 수 있어요.')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/70 rounded-xl font-sans text-sm text-text
                           border border-white/60 hover:bg-white hover:border-point transition-all duration-300"
              >
                <Link2 className="w-4 h-4 text-point-dark" />
                링크 공유
              </button>
            </div>
          </div>

          {/* 선물 이용 안내 */}
          <div className="mt-8 p-5 bg-white/40 rounded-2xl border border-white/40">
            <h3 className="font-sans text-sm font-medium text-text mb-3">선물 이용 안내</h3>
            <ul className="space-y-2">
              <li className="flex gap-2 font-sans text-xs text-text-sub leading-relaxed">
                <span className="text-point-dark flex-shrink-0">✦</span>
                선물 결제 완료 후 카카오톡으로 링크와 코드가 전송됩니다.
              </li>
              <li className="flex gap-2 font-sans text-xs text-text-sub leading-relaxed">
                <span className="text-point-dark flex-shrink-0">✦</span>
                링크는 1회만 사용 가능합니다.
              </li>
              <li className="flex gap-2 font-sans text-xs text-text-sub leading-relaxed">
                <span className="text-point-dark flex-shrink-0">✦</span>
                선물 코드는 6개월간 유효합니다.
              </li>
              <li className="flex gap-2 font-sans text-xs text-text-sub leading-relaxed">
                <span className="text-point-dark flex-shrink-0">✦</span>
                코드는 결과 페이지 하단 [선물 코드 입력하기]에서 사용할 수 있습니다.
              </li>
              <li className="flex gap-2 font-sans text-xs text-text-sub leading-relaxed">
                <span className="text-point-dark flex-shrink-0">✦</span>
                링크 만료 후에도 코드로 이용 가능합니다.
              </li>
              <li className="flex gap-2 font-sans text-xs text-text-sub leading-relaxed">
                <span className="text-point-dark flex-shrink-0">✦</span>
                환불은 콘텐츠 열람 전에만 가능합니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
