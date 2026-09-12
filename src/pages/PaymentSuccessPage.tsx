import { useEffect, useState } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { supabase, savePurchase, markResultPaid, upsertQuestions, createGiftCode, fetchGiftCodeByOrderId, GiftCodeRow } from '@/lib/supabase';
import {
  loadUserId,
  savePendingPurchase,
  loadPendingPurchase,
  clearPendingPurchase,
  loadResultId,
  clearResultId,
  loadGiftInfo,
  clearGiftInfo,
  PendingPurchase,
} from '@/lib/authStorage';
import { PageContainer } from '@/components/PageContainer';
import { Check, Sparkles, Gift, Share2 } from '@/components/Icons';
import { shareGiftViaKakao } from '@/lib/kakao';
import { copyLink } from '@/lib/share';
const SERVICE_URL = 'https://merriweather.net';
import type { ProductId } from '@/lib/portone';

const PRODUCT_AMOUNT_MAP: Record<ProductId, number> = {
  expedition: 4990,
  expedition_plus: 6980,
  extra_questions: 1990,
  gift_basic: 4990,
  gift_plus: 6980,
};

const PRODUCT_TYPE_MAP: Record<ProductId, string> = {
  expedition: '탐험권',
  expedition_plus: '탐험권+추가질문',
  extra_questions: '추가질문',
  gift_basic: '탐험권',
  gift_plus: '탐험권+추가질문',
};

export function PaymentSuccessPage() {
  const { setCurrentPage, residentKey, setSelectedResultId } = useApp();
  const { user, login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'done' | 'needLogin' | 'giftDone'>('processing');
  const [giftCode, setGiftCode] = useState<GiftCodeRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const impUid = params.get('imp_uid');
      const merchantUid = params.get('merchant_uid');
      const amount = params.get('amount');
      const productId = params.get('product_id') as ProductId | null;
      const impSuccess = params.get('imp_success');


      if (impSuccess === 'false') {
        if (!cancelled) setCurrentPage('payment');
        return;
      }

      // 모바일 결제 시 PG사 리다이렉트에서 product_id가 누락될 수 있으므로
      // merchant_uid(형식: merriweather-{productId}-{timestamp})에서 추출
      const VALID_PRODUCT_IDS: ProductId[] = ['expedition', 'expedition_plus', 'extra_questions', 'gift_basic', 'gift_plus'];
      let resolvedProductId = productId;
      if (!resolvedProductId && merchantUid) {
        const parts = merchantUid.split('-');
        if (parts.length >= 3) {
          const candidate = parts.slice(1, -1).join('-') as ProductId;
          if (VALID_PRODUCT_IDS.includes(candidate)) {
            resolvedProductId = candidate;
          }
        }
      }

      // amount가 null인 경우(모바일 결제 등) product_id로 금액 결정
      let resolvedAmount: number | null = amount ? Number(amount) : null;
      if (resolvedAmount === null && resolvedProductId) {
        resolvedAmount = PRODUCT_AMOUNT_MAP[resolvedProductId] ?? null;
      }

      const hasValidParams = impUid && merchantUid && resolvedAmount;
      if (!hasValidParams) {
        if (!cancelled) setStatus('done');
        return;
      }

      const isGift = resolvedProductId === 'gift_basic' || resolvedProductId === 'gift_plus';
      const productType = resolvedProductId ? (PRODUCT_TYPE_MAP[resolvedProductId] ?? '탐험권') : '탐험권';

      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;

      let userId: string | null = null;

      if (sessionData.session) {
        userId = sessionData.session.user.id;
      } else {
        userId = loadUserId();
      }

      if (!userId) {
        const pending: PendingPurchase = {
          impUid: impUid!,
          merchantUid: merchantUid!,
          amount: resolvedAmount!,
          productType,
        };
        savePendingPurchase(pending);
        if (!cancelled) setStatus('needLogin');
        return;
      }

      try {
        const result = await savePurchase(
          userId,
          productType,
          resolvedAmount!,
          impUid!,
          merchantUid!,
        );
        if (cancelled) return;
        if (result) {
        } else {
        }
      } catch (err) {
      }

      if (isGift) {
        const giftInfo = loadGiftInfo();

        try {
          const existingGift = await fetchGiftCodeByOrderId(merchantUid!);
          if (cancelled) return;

          if (existingGift) {
            if (!cancelled) {
              setGiftCode(existingGift);
              clearGiftInfo();
              setStatus('giftDone');
            }
            return;
          }

          const giftRow = await createGiftCode(
            userId,
            giftInfo?.recipient ?? '',
            giftInfo?.message ?? '',
            productType,
            merchantUid!,
          );
          if (cancelled) return;

          if (giftRow) {
            if (!cancelled) {
              setGiftCode(giftRow);
            }
          }
          clearGiftInfo();
          if (!cancelled) setStatus('giftDone');
          return;
        } catch (err) {
          clearGiftInfo();
          if (!cancelled) setStatus('giftDone');
          return;
        }
      }

      const savedResultId = loadResultId();

      let targetResultId: string | null = savedResultId;

      if (targetResultId) {
        try {
          const ok = await markResultPaid(targetResultId, productType);
          if (cancelled) return;
        } catch (err) {
        }
      } else {
      }

      const { data: resultRow } = await supabase
        .from('results')
        .select('id, resident_key')
        .eq('id', targetResultId ?? '')
        .maybeSingle();
      if (cancelled) return;

      if (targetResultId) {
        try {
          const qRow = await upsertQuestions(userId, targetResultId, productType);
          if (cancelled) return;
        } catch (err) {
        }
      }

      if (targetResultId) {
        if (!cancelled) {
          setSelectedResultId(targetResultId);
        }
      }

      if (!cancelled) setStatus('done');
    })();

    return () => {
      cancelled = true;
    };
  }, [setCurrentPage, setSelectedResultId]);

  // 처리 완료 후 페이지 이동
  useEffect(() => {
    if (status !== 'done') return;
    const timer = setTimeout(() => {
      if (residentKey) {
        setCurrentPage('premium');
      } else {
        window.location.href = '/';
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [status, setCurrentPage, residentKey]);

  // 로그인 필요 상태 - 로그인 모달 호출
  useEffect(() => {
    if (status !== 'needLogin') return;
    login('authCallback');
  }, [status, login]);

  // 선물 완료 후 페이지 이동
  useEffect(() => {
    if (status !== 'giftDone') return;
    return () => {};
  }, [status]);

  const [shareError, setShareError] = useState(false);
  const [kakaoError, setKakaoError] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleKakaoShare = async () => {
    if (!giftCode) return;
    setKakaoError(false);
    try {
      await shareGiftViaKakao({
        senderName: user?.nickname ?? '여행자',
        receiverName: giftCode.receiver_name || '여행자',
        giftCode: giftCode.code,
        giftPageUrl: `${SERVICE_URL}/gift?code=${encodeURIComponent(giftCode.code)}`,
        homeUrl: SERVICE_URL,
        imageUrl: `${SERVICE_URL}/landing-bg.png`,
      });
    } catch (err) {
      setKakaoError(true);
    }
  };

  const handleWebShare = async () => {
    if (!giftCode) return;
    setShareError(false);
    setCopiedShare(false);
    const senderName = user?.nickname ?? '여행자';
    const receiverName = giftCode.receiver_name || '여행자';
    const giftPageUrl = `${SERVICE_URL}/gift?code=${encodeURIComponent(giftCode.code)}`;
    const shareText = `${senderName}님이 ${receiverName}님께 메리웨더 선물을 보냈어요 🎁\n\n${giftCode.message}\n\n선물 코드: ${giftCode.code}\n\n선물 페이지: ${giftPageUrl}`;

    if (!navigator.share) {
      const ok = await copyLink(shareText);
      if (ok) setCopiedShare(true);
      else setShareError(true);
      return;
    }

    try {
      await navigator.share({
        title: '메리웨더 선물이 도착했어요 🎁',
        text: shareText,
        url: giftPageUrl,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setShareError(true);
      const ok = await copyLink(shareText);
      if (ok) setCopiedShare(true);
    }
  };

  const handleCopyCode = () => {
    if (!giftCode) return;
    navigator.clipboard?.writeText(giftCode.code);
  };

  return (
    <PageContainer className="bg-base" footer={false}>
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-6 text-center">
        {status === 'needLogin' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-point/15 flex items-center justify-center mb-6 animate-scaleIn">
              <Sparkles className="w-10 h-10 text-point" />
            </div>
            <h1 className="font-batang text-2xl text-text mb-3 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
              결제가 완료됐어요!
            </h1>
            <p className="font-sans text-sm text-text-sub mb-8 animate-fadeUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
              결제를 저장하려면 로그인이 필요해요. 로그인 창으로 이동합니다.
            </p>
          </>
        ) : status === 'giftDone' && giftCode ? (
          <div className="w-full max-w-sm">
            <div className="w-20 h-20 rounded-full bg-point/15 flex items-center justify-center mx-auto mb-6 animate-scaleIn">
              <Gift className="w-10 h-10 text-point" />
            </div>
            <h1 className="font-batang text-2xl text-text mb-2 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
              선물이 완성됐어요.
            </h1>
            <p className="font-sans text-sm text-text-sub mb-8 animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
              소중한 사람에게 마음을 전해보세요.
            </p>

            {/* 받는 분 + 메시지 카드 */}
            <div className="p-5 bg-gradient-to-br from-golden/15 to-golden/5 rounded-2xl border border-golden/30 mb-5 animate-fadeUp" style={{ animationDelay: '0.5s', opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-point-dark text-sm">✦</span>
                <span className="font-sans text-xs text-text-sub">받는 분</span>
                <span className="font-batang text-base text-text ml-1">{giftCode.receiver_name || '여행자'}</span>
              </div>
              {giftCode.message && (
                <div className="pt-3 border-t border-golden/20">
                  <p className="font-batang text-sm text-text leading-relaxed whitespace-pre-line">
                    "{giftCode.message}"
                  </p>
                </div>
              )}
            </div>

            {/* 선물 코드 */}
            <div className="px-6 py-5 bg-white/90 rounded-2xl border-2 border-point shadow-lg mb-5 animate-fadeUp" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <p className="font-sans text-xs text-text-sub mb-2 text-center">선물 코드</p>
              <p className="font-sans text-2xl font-bold tracking-[0.3em] text-text text-center">{giftCode.code}</p>
              <p className="font-sans text-xs text-text-sub mt-3 text-center">
                유효기간: 6개월 ({new Date(giftCode.expires_at).toLocaleDateString('ko-KR')}까지)
              </p>
            </div>

            {/* 버튼 영역 */}
            <div className="space-y-3 animate-fadeUp" style={{ animationDelay: '0.8s', opacity: 0 }}>
              <button
                onClick={handleKakaoShare}
                className="w-full py-4 bg-[#FEE500] text-[#3C1E1E] rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-95
                           flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3C6.48 3 2 6.94 2 11.6c0 2.79 1.63 5.26 4.15 6.85-.2.75-.74 2.7-.85 3.12-.14.53.2.52.42.38.17-.11 2.72-1.85 3.82-2.6.8.12 1.63.19 2.46.19 5.52 0 10-3.94 10-8.6S17.52 3 12 3z"/>
                </svg>
                카카오톡으로 공유하기
              </button>
              {kakaoError && (
                <p className="font-sans text-xs text-error text-center leading-relaxed">
                  카카오톡 공유에 실패했어요. 다른 앱으로 공유하기를 이용해주세요.
                </p>
              )}
              <button
                onClick={handleWebShare}
                className="w-full py-4 bg-point text-white rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95
                           flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                다른 앱으로 공유하기
              </button>
              {copiedShare && (
                <p className="font-sans text-xs text-point-dark text-center leading-relaxed">
                  선물 메시지를 클립보드에 복사했어요.
                </p>
              )}
              {shareError && (
                <p className="font-sans text-xs text-error text-center leading-relaxed">
                  공유에 실패했어요. 대신 코드 복사하기를 이용해주세요.
                </p>
              )}
              <button
                onClick={handleCopyCode}
                className="w-full py-3.5 bg-white border border-[#E0DDD8] rounded-2xl font-sans font-medium text-sm text-text
                           hover:border-point hover:text-point transition-all duration-300 active:scale-95
                           flex items-center justify-center gap-2"
              >
                코드 복사하기
              </button>
              <button
                onClick={() => setCurrentPage('landing')}
                className="w-full py-3 font-sans text-sm text-text-sub hover:text-text transition-colors"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-point/15 flex items-center justify-center mb-6 animate-scaleIn">
              <Check className="w-10 h-10 text-point" />
            </div>
            <h1 className="font-batang text-2xl text-text mb-3 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
              결제가 완료됐어요!
            </h1>
            <p className="font-sans text-sm text-text-sub mb-8 animate-fadeUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
              잠시 후 유료 결과 페이지로 이동합니다.
            </p>
            <div className="flex items-center gap-2 text-point-dark animate-fadeUp" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="font-sans text-sm">이동 중...</span>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
