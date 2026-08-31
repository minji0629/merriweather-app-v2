import { useEffect, useState } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { supabase, savePurchase, markResultPaid, upsertQuestions, createGiftCode, GiftCodeRow } from '@/lib/supabase';
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
import type { ProductId } from '@/lib/portone';

const PRODUCT_TYPE_MAP: Record<ProductId, string> = {
  expedition: '탐험권',
  expedition_plus: '탐험권+추가질문',
  extra_questions: '추가질문',
  gift_basic: '탐험권',
  gift_plus: '탐험권+추가질문',
};

export function PaymentSuccessPage() {
  const { setCurrentPage, residentKey, setSelectedResultId } = useApp();
  const { login } = useAuth();
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

      console.log('[Payment Success] 파라미터:', { impUid, merchantUid, amount, productId, impSuccess });

      if (impSuccess === 'false') {
        console.warn('[Payment Success] 결제 취소/실패 (imp_success=false)');
        if (!cancelled) setCurrentPage('payment');
        return;
      }

      const hasValidParams = impUid && merchantUid && amount;
      if (!hasValidParams) {
        console.warn('[Payment Success] 필수 파라미터 누락');
        if (!cancelled) setStatus('done');
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
            console.log('[Payment Success] merchant_uid에서 product_id 추출:', resolvedProductId);
          }
        }
      }

      const isGift = resolvedProductId === 'gift_basic' || resolvedProductId === 'gift_plus';
      const productType = resolvedProductId ? (PRODUCT_TYPE_MAP[resolvedProductId] ?? '탐험권') : '탐험권';

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      console.log('[Payment Success] getSession:', {
        hasSession: !!sessionData.session,
        sessionError: sessionError?.message,
      });

      let userId: string | null = null;

      if (sessionData.session) {
        userId = sessionData.session.user.id;
        console.log('[Payment Success] 세션에서 사용자 ID 확인:', userId);
      } else {
        userId = loadUserId();
        console.log('[Payment Success] localStorage 사용자 ID:', userId);
      }

      if (!userId) {
        console.warn('[Payment Success] 사용자 ID 없음 - 임시 저장 후 로그인 필요');
        const pending: PendingPurchase = {
          impUid: impUid!,
          merchantUid: merchantUid!,
          amount: Number(amount),
          productType,
        };
        savePendingPurchase(pending);
        console.log('[Payment Success] 임시 저장 완료:', pending);
        if (!cancelled) setStatus('needLogin');
        return;
      }

      console.log('[Payment Success] purchases insert 호출:', {
        userId,
        productType,
        amount: Number(amount),
        impUid,
        merchantUid,
      });
      try {
        const result = await savePurchase(
          userId,
          productType,
          Number(amount),
          impUid!,
          merchantUid!,
        );
        if (cancelled) return;
        if (result) {
          console.log('[Results] PaymentSuccess - purchases insert 성공:', result.id);
        } else {
          console.error('[Results] PaymentSuccess - purchases insert 실패: null 반환');
        }
      } catch (err) {
        console.error('[Results] PaymentSuccess - savePurchase 예외:', err);
      }

      if (isGift) {
        const giftInfo = loadGiftInfo();
        console.log('[Payment Success] 선물 정보:', giftInfo);

        try {
          const giftRow = await createGiftCode(
            userId,
            giftInfo?.recipient ?? '',
            giftInfo?.message ?? '',
            productType,
          );
          if (cancelled) return;
          console.log('[Payment Success] createGiftCode 결과:', giftRow);

          if (giftRow) {
            if (!cancelled) {
              setGiftCode(giftRow);
              clearGiftInfo();
              setStatus('giftDone');
            }
            return;
          } else {
            console.error('[Payment Success] createGiftCode 실패');
          }
        } catch (err) {
          console.error('[Payment Success] createGiftCode 예외:', err);
        }
      }

      const savedResultId = loadResultId();
      console.log('[Payment] 결제 전 저장된 result_id:', savedResultId);

      let targetResultId: string | null = savedResultId;

      if (targetResultId) {
        try {
          console.log('[Payment] markResultPaid 호출, result_id:', targetResultId, 'productType:', productType);
          const ok = await markResultPaid(targetResultId, productType);
          if (cancelled) return;
          console.log('[Payment] markResultPaid 결과:', ok);
        } catch (err) {
          console.error('[Payment] markResultPaid 예외:', err);
        }
      } else {
        console.error('[Payment] 저장된 result_id 없음 - 결제 전 saveFreeResult가 선행되지 않았을 수 있습니다.');
      }

      const { data: resultRow } = await supabase
        .from('results')
        .select('id, resident_key')
        .eq('id', targetResultId ?? '')
        .maybeSingle();
      if (cancelled) return;
      console.log('[Payment] 결제 후 불러온 result_id:', resultRow?.id ?? null);
      console.log('[Payment] 표시된 주민 키:', resultRow?.resident_key ?? null);

      if (targetResultId) {
        try {
          const qRow = await upsertQuestions(userId, targetResultId, productType);
          if (cancelled) return;
          console.log('[Payment] upsertQuestions 결과:', qRow);
        } catch (err) {
          console.error('[Payment] upsertQuestions 예외:', err);
        }
      }

      if (targetResultId) {
        if (!cancelled) {
          setSelectedResultId(targetResultId);
          console.log('[Payment] selectedResultId 설정:', targetResultId);
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
    console.log('[Payment Success] 로그인 페이지로 이동');
    login('authCallback');
  }, [status, login]);

  // 선물 완료 후 페이지 이동
  useEffect(() => {
    if (status !== 'giftDone') return;
    return () => {};
  }, [status]);

  const handleGiftShare = async () => {
    if (!giftCode) return;
    const shareUrl = `${window.location.origin}/gift?code=${giftCode.code}`;
    const shareText = `${giftCode.receiver_name}님에게 보내는 선물이 도착했어요.\n메리웨더에서 코드를 입력하면 열어볼 수 있어요.\n\n선물 코드: ${giftCode.code}\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '메리웨더 선물',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // 공유 취소 시 무시
      }
    } else {
      navigator.clipboard?.writeText(shareText);
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
                onClick={handleGiftShare}
                className="w-full py-4 bg-point text-white rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95
                           flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                공유하기
              </button>
              <p className="font-sans text-xs text-text-sub text-center leading-relaxed">
                이 화면을 직접 캡처하거나 공유하기 버튼으로 선물 코드를 전달해주세요.
              </p>
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
