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
  const navigatedRef = useRef(false);
  const processStartedRef = useRef(false);

  // returnPage를 effect 시작 시점에 동기적으로 캡처하여
  // StrictMode 중복 실행이나 경쟁 상태에서도 안전하게 유지
  const savedReturnPage = useRef<string | null>(null);

  useEffect(() => {
    // 동기적으로 returnPage를 캡처 (effect 재실행 시에도 안전)
    if (!savedReturnPage.current) {
      savedReturnPage.current = loadReturnPage();
      console.log('[Auth Callback] returnPage 캡처:', savedReturnPage.current);
    }

    let cancelled = false;
    let unsub: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const processSession = async (authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
      // processSession이 여러 소스에서 동시에 호출되어도 한 번만 실행되도록 보장
      if (processStartedRef.current) return;
      processStartedRef.current = true;

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

        // returnPage를 localStorage에서 다시 한번 확인 (ref가 null일 경우 대비)
        const returnPage = savedReturnPage.current || loadReturnPage();
        const targetPage = (returnPage as 'landing' | 'nickname' | 'result' | 'payment' | 'authCallback') || 'landing';
        console.log('[Auth Callback] 최종 이동:', targetPage, '| returnPage:', returnPage, '| savedRef:', savedReturnPage.current);
        if (returnPage === 'result') {
          console.log('[Auth Callback] returnPage=result → 결과 페이지로 이동 확인');
        }
        setCurrentPage(targetPage);
        // navigation 완료 후에 returnPage 삭제
        clearReturnPage();
      } catch (err) {
        if (cancelled) return;
        console.error('[Auth Callback] 실패:', err);
        setError(err instanceof Error ? err.message : '로그인에 실패했어요.');
      }
    };

    // onAuthStateChange를 가장 먼저 설정하여 SIGNED_IN 이벤트를 놓치지 않도록 함
    // 모바일 전체 페이지 리다이렉트에서 PKCE 코드 교환 완료 시 SIGNED_IN이 발생
    console.log('[Auth Callback] onAuthStateChange 리스너 설정');
    const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      console.log('[Auth Callback] onAuthStateChange:', event, !!session);
      // SIGNED_IN 이벤트 대기 (모바일 PKCE 교환 완료 시점)
      // INITIAL_SESSION도 세션이 이미 있는 경우(교환 완료 후 리스너 설정)를 대비해 처리
      if ((event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) && session) {
        if (unsub) { unsub(); unsub = null; }
        processSession(session.user);
      }
    });
    unsub = subData.subscription.unsubscribe;

    // getSession()도 병렬로 시도 — 세션이 이미 있다면 빠르게 처리
    (async () => {
      try {
        console.log('[Auth Callback] getSession 시도');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        console.log('[Auth Callback] getSession:', { sessionError, hasSession: !!sessionData.session });

        if (sessionError) {
          console.error('[Auth Callback] getSession error:', sessionError);
        }

        if (sessionData.session && !processStartedRef.current) {
          if (unsub) { unsub(); unsub = null; }
          processSession(sessionData.session.user);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[Auth Callback] getSession 실패:', err);
      }
    })();

    // 타임아웃 폴백: 15초 후 세션 재확인
    // 모바일에서 PKCE 교환이 지연되는 경우 최후의 안전망
    timeoutId = setTimeout(async () => {
      if (cancelled || navigatedRef.current) return;
      console.log('[Auth Callback] 타임아웃, 세션 재확인');
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled || navigatedRef.current) return;
        if (sessionData.session) {
          if (unsub) { unsub(); unsub = null; }
          processSession(sessionData.session.user);
        } else {
          setError('로그인 시간이 초과되었어요. 다시 시도해주세요.');
        }
      } catch {
        if (!cancelled && !navigatedRef.current) {
          setError('로그인 시간이 초과되었어요. 다시 시도해주세요.');
        }
      }
    }, 15000);

    return () => {
      cancelled = true;
      if (unsub) { unsub(); unsub = null; }
      if (timeoutId) clearTimeout(timeoutId);
      // cleanup 시 processStartedRef 리셋 — StrictMode 재실행이나 의존성 변경으로
      // effect가 재실행될 때 새 effect가 정상적으로 processSession을 실행할 수 있도록
      if (!navigatedRef.current) {
        processStartedRef.current = false;
        console.log('[Auth Callback] cleanup: processStartedRef 리셋 (navigation 미완료)');
      }
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
