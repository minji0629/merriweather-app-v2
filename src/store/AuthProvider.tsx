import { ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import { AuthContext, AuthState, AuthUser, MarketingConsent } from '@/store/authContext';
import { supabase, upsertUser } from '@/lib/supabase';
import {
  hasMarketingConsent,
  setMarketingConsented,
  loadMarketingDetail,
  saveMarketingDetail,
  saveReturnPage,
  saveUserId,
  clearUserId,
} from '@/lib/authStorage';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isMarketingOpen, setMarketingOpen] = useState(false);
  const [marketingConsent, setMarketingConsentState] = useState<MarketingConsent>(loadMarketingDetail);

  const setUser = useCallback((u: AuthUser) => {
    setUserState(u);
    saveUserId(u.id);
    if (!hasMarketingConsent()) {
      setMarketingOpen(true);
    }
  }, []);

  const login = useCallback(async (returnPage?: string) => {
    const pageToSave = returnPage || 'landing';
    console.log('[Auth] login - 저장할 returnPage:', pageToSave);
    saveReturnPage(pageToSave);
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        queryParams: {
          scope: 'profile_nickname',
        },
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUserState(null);
    clearUserId();
  }, []);

  const showLogin = useCallback(() => setLoginOpen(true), []);
  const hideLogin = useCallback(() => setLoginOpen(false), []);
  const showMarketing = useCallback(() => setMarketingOpen(true), []);
  const hideMarketing = useCallback(() => setMarketingOpen(false), []);

  const saveMarketingConsent = useCallback((consent: MarketingConsent) => {
    setMarketingConsentState(consent);
    saveMarketingDetail(consent);
    setMarketingConsented(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      if (sessionData.session) {
        const authUser = sessionData.session.user;
        const nickname =
          (authUser.user_metadata?.nickname as string) ||
          (authUser.user_metadata?.name as string) ||
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.preferred_username as string) ||
          '사용자';
        setUser({ id: authUser.id, nickname, email: authUser.email ?? null });

        upsertUser(authUser.id, nickname, marketingConsent, authUser.email ?? undefined)
          .then((dbUser) => {
            if (mounted && dbUser) {
              console.log('[Auth] 세션 복원 - upsertUser 성공:', dbUser.id);
            } else if (mounted) {
              console.error('[Auth] 세션 복원 - upsertUser 실패: null 반환');
            }
          })
          .catch((err) => console.error('[Auth] 세션 복원 - upsertUser 예외:', err));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setUser, marketingConsent]);

  const value: AuthState = useMemo(
    () => ({
      user,
      setUser,
      login,
      logout,
      showLogin,
      hideLogin,
      isLoginOpen,
      showMarketing,
      hideMarketing,
      isMarketingOpen,
      saveMarketingConsent,
      marketingConsent,
    }),
    [user, setUser, login, logout, showLogin, hideLogin, isLoginOpen, showMarketing, hideMarketing, isMarketingOpen, saveMarketingConsent, marketingConsent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
