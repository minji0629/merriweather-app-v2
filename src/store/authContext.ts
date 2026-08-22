import { createContext } from 'react';

export interface AuthUser {
  id: string;
  nickname: string;
  email: string | null;
}

export interface MarketingConsent {
  kakao: boolean;
  email: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  login: (returnPage?: string) => Promise<void>;
  logout: () => Promise<void>;
  showLogin: () => void;
  hideLogin: () => void;
  isLoginOpen: boolean;
  showMarketing: () => void;
  hideMarketing: () => void;
  isMarketingOpen: boolean;
  saveMarketingConsent: (consent: MarketingConsent) => void;
  marketingConsent: MarketingConsent;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
