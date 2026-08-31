import { useEffect, useRef, useState } from 'react';
import { supabase, upsertUser, saveFreeResult, savePurchase, markResultPaid, fetchLatestResultId, linkResultToUser, linkQuestionsToUser, upsertQuestions } from '@/lib/supabase';
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
  const navigatedRef = useRef(false);

  // returnPage를 effect 시작 시점에 동기적으로 캡처하여
  // StrictMode 중복 실행이나 경쟁 상태에서도 안전하게 유지
  const savedReturnPage = useRef<string | null>(null);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    // 동기적으로 returnPage를 캡처 (effect 재실행 시에도 안전)
    if (!savedReturnPage.current) {
      savedReturnPage.current = loadReturnPage();
      console.log('[Auth Callback] returnPage 캡처:', savedReturnPage.current);
    }

    let cancelled = false;
    let unsub: (() => void) | null = null;

    const processSession = async (authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      try {
        const nickname =
          (authUser.user_metadata?.nickname as string) ||
          (authUser.user_metadata?.name as string) ||
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.preferred_username as string) ||
          '사용자';
        const email = authUser.email ?? null;

        const authUserObj = { id: authUser.id, nickname, email };
        if (!cancelled) setUser(authUserObj);

        const dbUser = await upsertUser(authUser.id, nickname, marketingConsent, email ?? undefined);
        if (cancelled) return;
        console.log('[Auth Callback] upsertUser 결과:', dbUser);

        if (dbUser) {
          const preLogin = loadPreLoginResult();
          const pendingResultId = preLogin?.resultId ?? loadResultId();
          const effectiveResidentKey = (preLogin?.residentKey ?? residentKey ?? '') as ResidentKey;

          if (preLogin) {
            console.log('[Auth Callback] pre-login 결과 복원:', preLogin);
          }

          if (pendingResultId) {
            const linked = await linkResultToUser(pendingResultId, dbUser.id);
            if (cancelled) return;
            if (linked) {
              await linkQuestionsToUser(pendingResultId, dbUser.id);
              if (cancelled) return;
              saveResultId(pendingResultId);
              setSelectedResultId(pendingResultId);
              if (effectiveResidentKey) {
                setSelectedResidentKey(effectiveResidentKey);
              }
            } else {
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
            const existingResultId = await fetchLatestResultId(dbUser.id);
            if (cancelled) return;
            if (existingResultId) {
              saveResultId(existingResultId);
              setSelectedResultId(existingResultId);
            } else {
              const result = await saveFreeResult(dbUser.id, effectiveResidentKey, { answers });
              if (cancelled) return;
              if (result) {
                saveResultId(result.id);
                setSelectedResultId(result.id);
              }
            }
          }
          clearPreLoginResult();
        }

        const pending = loadPendingPurchase();
        if (pending) {
          try {
            const result = await savePurchase(
              authUser.id,
              pending.productType,
              pending.amount,
              pending.impUid,
              pending.merchantUid,
            );
            const pendingResultId = loadResultId();
            if (pendingResultId) {
              await markResultPaid(pendingResultId, pending.productType);
              await upsertQuestions(authUser.id, pendingResultId, pending.productType);
            }
          } catch (err) {
            console.error('[Auth Callback] pending 결제 저장 실패:', err);
          }
          clearPendingPurchase();
        }

        if (cancelled) return;
        if (navigatedRef.current) return;
        navigatedRef.current = true;

        const returnPage = savedReturnPage.current;
        const targetPage = (returnPage as 'landing' | 'nickname' | 'result' | 'payment' | 'authCallback') || 'landing';
        clearReturnPage();
        console.log('[Auth Callback] 이동:', targetPage);
        setCurrentPage(targetPage);
      } catch (err) {
        if (cancelled) return;
        console.error('[Auth Callback] 실패:', err);
        setError(err instanceof Error ? err.message : '로그인에 실패했어요.');
      }
    };

    (async () => {
      try {
        console.log('[Auth Callback] 시작');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        console.log('[Auth Callback] getSession:', { sessionError, hasSession: !!sessionData.session });

        if (sessionData.session) {
          await processSession(sessionData.session.user);
          return;
        }

        // 모바일에서 getSession이 아직 세션을 반환하지 않을 수 있음 —
        // PKCE 코드 교환이 완료되기를 onAuthStateChange로 대기
        console.log('[Auth Callback] 세션 없음, onAuthStateChange 대기...');
        unsub = supabase.auth.onAuthStateChange((event, session) => {
          if (cancelled) return;
          if (event === 'SIGNED_IN' && session) {
            console.log('[Auth Callback] onAuthStateChange: SIGNED_IN');
            if (unsub) { unsub(); unsub = null; }
            processSession(session.user);
          }
        }).data.subscription.unsubscribe;
      } catch (err) {
        if (cancelled) return;
        console.error('[Auth Callback] 실패:', err);
        setError(err instanceof Error ? err.message : '로그인에 실패했어요.');
      }
    })();

    return () => {
      cancelled = true;
      processingRef.current = false;
      if (unsub) { unsub(); unsub = null; }
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
