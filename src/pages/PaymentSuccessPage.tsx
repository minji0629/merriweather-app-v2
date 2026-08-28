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
import { Check, Sparkles, Gift } from '@/components/Icons';
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

      const isGift = productId === 'gift_basic' || productId === 'gift_plus';
      const productType = productId ? (PRODUCT_TYPE_MAP[productId] ?? '탐험권') : '탐험권';

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
    const timer = setTimeout(() => {
      setCurrentPage('landing');
    }, 5000);
    return () => clearTimeout(timer);
  }, [status, setCurrentPage]);

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
          <>
            <div className="w-20 h-20 rounded-full bg-point/15 flex items-center justify-center mb-6 animate-scaleIn">
              <Gift className="w-10 h-10 text-point" />
            </div>
            <h1 className="font-batang text-2xl text-text mb-3 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
              선물 코드가 생성됐어요!
            </h1>
            <p className="font-sans text-sm text-text-sub mb-6 animate-fadeUp" style={{ animationDelay: '0.4s', opacity: 0 }}>
              아래 코드를 받는 분에게 전달해주세요.
            </p>
            <div className="px-8 py-5 bg-white/80 rounded-2xl border-2 border-point shadow-lg mb-6 animate-fadeUp" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <p className="font-sans text-xs text-text-sub mb-1">선물 코드</p>
              <p className="font-sans text-2xl font-bold tracking-[0.3em] text-text">{giftCode.code}</p>
            </div>
            {giftCode.receiver_name && (
              <p className="font-sans text-sm text-text-sub mb-1 animate-fadeUp" style={{ animationDelay: '0.8s', opacity: 0 }}>
                받는 분: {giftCode.receiver_name}
              </p>
            )}
            <p className="font-sans text-xs text-text-sub mb-8 animate-fadeUp" style={{ animationDelay: '0.9s', opacity: 0 }}>
              유효기간: 6개월 (만료일 {new Date(giftCode.expires_at).toLocaleDateString('ko-KR')})
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(giftCode.code);
              }}
              className="px-6 py-3 bg-point text-white rounded-xl font-sans font-medium text-sm
                         shadow-md transition-all duration-300 hover:bg-point-dark hover:shadow-lg active:scale-95
                         animate-fadeUp"
              style={{ animationDelay: '1s', opacity: 0 }}
            >
              코드 복사하기
            </button>
          </>
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
