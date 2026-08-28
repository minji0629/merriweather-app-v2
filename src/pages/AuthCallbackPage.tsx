import { useEffect, useRef, useState } from 'react';
import { supabase, upsertUser, saveFreeResult, savePurchase, markResultPaid, fetchLatestResultId, linkResultToUser, linkQuestionsToUser } from '@/lib/supabase';
import {
  loadReturnPage,
  clearReturnPage,
  loadPendingPurchase,
  clearPendingPurchase,
  saveResultId,
  loadResultId,
  loadPreLoginResult,
  clearPreLoginResult,
} from '@/lib/authStorage';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import type { ResidentKey } from '@/constants/questions';

export function AuthCallbackPage() {
  const { setCurrentPage, residentKey, answers, setSelectedResultId, setSelectedResidentKey } = useApp();
  const { setUser, marketingConsent } = useAuth();
  const [error, setError] = useState('');
  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        console.log('[Auth Callback] 시작');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        console.log('[Auth Callback] getSession:', { sessionError, hasSession: !!sessionData.session });
        if (sessionError || !sessionData.session) {
          throw new Error('세션을 가져오지 못했습니다.');
        }

        const authUser = sessionData.session.user;
        console.log('[Auth Callback] user:', { id: authUser.id, email: authUser.email });
        console.log('[Auth Callback] user_metadata:', authUser.user_metadata);

        const nickname =
          (authUser.user_metadata?.nickname as string) ||
          (authUser.user_metadata?.name as string) ||
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.preferred_username as string) ||
          '사용자';
        const email = authUser.email ?? null;
        console.log('[Auth Callback] 추출값:', { nickname, email });

        const authUserObj = { id: authUser.id, nickname, email };
        if (!cancelled) setUser(authUserObj);

        console.log('[Auth Callback] upsertUser 호출:', { id: authUser.id, nickname, email, marketingConsent });
        const dbUser = await upsertUser(authUser.id, nickname, marketingConsent, email ?? undefined);
        if (cancelled) return;
        console.log('[Auth Callback] upsertUser 결과:', dbUser);

        if (dbUser) {
          // Restore pre-login result context from localStorage
          const preLogin = loadPreLoginResult();
          const pendingResultId = preLogin?.resultId ?? loadResultId();
          const effectiveResidentKey = (preLogin?.residentKey ?? residentKey ?? '') as ResidentKey;

          if (preLogin) {
            console.log('[Auth Callback] pre-login 결과 복원:', preLogin);
          }

          if (pendingResultId) {
            // Link the existing anonymous result to the real user
            const linked = await linkResultToUser(pendingResultId, dbUser.id);
            if (cancelled) return;
            console.log('[Results] AuthCallback - 기존 결과 연결:', { pendingResultId, linked });
            if (linked) {
              await linkQuestionsToUser(pendingResultId, dbUser.id);
              if (cancelled) return;
              saveResultId(pendingResultId);
              setSelectedResultId(pendingResultId);
              if (effectiveResidentKey) {
                setSelectedResidentKey(effectiveResidentKey);
              }
            } else {
              // Link failed — try to find existing result or create new one
              const existingResultId = await fetchLatestResultId(dbUser.id);
              if (cancelled) return;
              if (existingResultId) {
                saveResultId(existingResultId);
                setSelectedResultId(existingResultId);
              } else if (effectiveResidentKey) {
                const result = await saveFreeResult(dbUser.id, effectiveResidentKey, { answers });
                if (cancelled) return;
                if (result) {
                  saveResultId(result.id);
                  setSelectedResultId(result.id);
                }
              }
            }
          } else if (effectiveResidentKey) {
            // No pending result — check for existing or create new
            const existingResultId = await fetchLatestResultId(dbUser.id);
            if (cancelled) return;
            if (existingResultId) {
              console.log('[Results] AuthCallback - 기존 결과 재사용:', existingResultId);
              saveResultId(existingResultId);
              setSelectedResultId(existingResultId);
            } else {
              console.log('[Results] AuthCallback - saveFreeResult 호출:', { userId: dbUser.id, effectiveResidentKey, answersCount: answers.length });
              const result = await saveFreeResult(dbUser.id, effectiveResidentKey, { answers });
              if (cancelled) return;
              console.log('[Results] AuthCallback - saveFreeResult 결과:', result ? `성공 (id: ${result.id})` : '실패 (null)');
              if (result) {
                saveResultId(result.id);
                setSelectedResultId(result.id);
              }
            }
          }
          clearPreLoginResult();
        } else {
          console.log('[Results] AuthCallback - saveFreeResult 스킵: dbUser 없음');
        }

        // Handle pending purchase
        const pending = loadPendingPurchase();
        if (pending) {
          console.log('[Auth Callback] 대기 중 결제 저장:', pending);
          try {
            const result = await savePurchase(
              authUser.id,
              pending.productType,
              pending.amount,
              pending.impUid,
              pending.merchantUid,
            );
            console.log('[Auth Callback] pending purchases insert 결과:', result);
            const pendingResultId = loadResultId();
            if (pendingResultId) {
              await markResultPaid(pendingResultId, pending.productType);
              console.log('[Auth Callback] pending markResultPaid 완료, result_id:', pendingResultId, 'productType:', pending.productType);
            }
          } catch (err) {
            console.error('[Auth Callback] pending 결제 저장 실패:', err);
          }
          clearPendingPurchase();
        }

        if (cancelled) return;

        const returnPage = loadReturnPage();
        clearReturnPage();
        const targetPage = (returnPage as 'landing' | 'nickname' | 'result' | 'payment' | 'authCallback') || 'landing';
        console.log('[Auth Callback] 이동:', targetPage);
        setCurrentPage(targetPage);
      } catch (err) {
        if (cancelled) return;
        console.error('[Auth Callback] 실패:', err);
        setError(err instanceof Error ? err.message : '로그인에 실패했어요.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setCurrentPage, setUser, marketingConsent, residentKey, answers, setSelectedResultId, setSelectedResidentKey]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base px-6">
      {error ? (
        <div className="text-center">
          <p className="font-batang text-xl text-text mb-2">로그인 실패</p>
          <p className="font-sans text-sm text-red-500 mb-6">{error}</p>
          <button
            onClick={() => setCurrentPage('landing')}
            className="px-6 py-3 bg-point text-white rounded-2xl font-playfair font-bold tracking-[0.12em] text-sm
                       shadow-lg hover:bg-point-dark transition-all active:scale-95"
          >
            MERRIWEATHER
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-3 border-point/30 border-t-point rounded-full animate-spin" />
          <p className="font-sans text-sm text-text-sub">로그인 처리 중...</p>
          <p className="font-batang text-base text-text mt-3">메리웨더의 주민이 되었어요. 환영해요 😊</p>
        </div>
      )}
    </div>
  );
}
