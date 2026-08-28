import { ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import { AppContext, AppState, Page, Answer } from '@/store/appContext';
import { ResidentKey } from '@/constants/questions';
import { clearResultId, clearPreLoginResult } from '@/lib/authStorage';

const STORAGE_KEY = 'merriweather:app-state';

interface PersistedState {
  nickname: string;
  residentKey: ResidentKey | null;
  secondResidentKey: ResidentKey | null;
  answers: Answer[];
}

function loadPersistedState(): PersistedState {
  if (typeof window === 'undefined') return { nickname: '', residentKey: null, secondResidentKey: null, answers: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nickname: '', residentKey: null, secondResidentKey: null, answers: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      nickname: parsed.nickname ?? '',
      residentKey: parsed.residentKey ?? null,
      secondResidentKey: parsed.secondResidentKey ?? null,
      answers: parsed.answers ?? [],
    };
  } catch {
    return { nickname: '', residentKey: null, secondResidentKey: null, answers: [] };
  }
}

function detectInitialRoute(): { page: Page; sharedResultId: string | null; sharedResultScope: 'basic' | 'full' | null } {
  if (typeof window === 'undefined') return { page: 'landing', sharedResultId: null, sharedResultScope: null };
  const path = window.location.pathname;
  if (path === '/payment/success') return { page: 'paymentSuccess', sharedResultId: null, sharedResultScope: null };
  if (path === '/payment/fail') return { page: 'paymentFail', sharedResultId: null, sharedResultScope: null };
  if (path === '/auth/callback') return { page: 'authCallback', sharedResultId: null, sharedResultScope: null };
  const sharedMatch = path.match(/^\/result\/([0-9a-fA-F-]{36})$/);
  if (sharedMatch) {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('share');
    const scope: 'basic' | 'full' | null = raw === 'full' ? 'full' : raw === 'basic' ? 'basic' : null;
    return { page: 'sharedResult', sharedResultId: sharedMatch[1], sharedResultScope: scope };
  }
  return { page: 'landing', sharedResultId: null, sharedResultScope: null };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(loadPersistedState, []);
  const initialRoute = useMemo(detectInitialRoute, []);

  const [nickname, setNickname] = useState(persisted.nickname);
  const [currentPage, setCurrentPageState] = useState<Page>(initialRoute.page);
  const [previousPage, setPreviousPage] = useState<Page | null>(null);
  const [answers, setAnswers] = useState<Answer[]>(persisted.answers);
  const [residentKey, setResidentKey] = useState<ResidentKey | null>(persisted.residentKey);
  const [secondResidentKey, setSecondResidentKey] = useState<ResidentKey | null>(persisted.secondResidentKey);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [selectedResidentKey, setSelectedResidentKey] = useState<ResidentKey | null>(null);
  const [sharedResultId, setSharedResultId] = useState<string | null>(initialRoute.sharedResultId);
  const [sharedResultScope, setSharedResultScope] = useState<'basic' | 'full' | null>(initialRoute.sharedResultScope);

  const setCurrentPage = useCallback((page: Page) => {
    setCurrentPageState((prev) => {
      setPreviousPage(prev);
      return page;
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ nickname, residentKey, secondResidentKey, answers }),
      );
    } catch {
      // ignore quota / serialization errors
    }
  }, [nickname, residentKey, secondResidentKey, answers]);

  const addAnswer = useCallback((answer: Answer) => {
    setAnswers((prev) => [...prev, answer]);
  }, []);

  const resetAnswers = useCallback(() => setAnswers([]), []);

  const restart = useCallback(() => {
    setNickname('');
    setAnswers([]);
    setResidentKey(null);
    setSecondResidentKey(null);
    setSelectedResultId(null);
    setSelectedResidentKey(null);
    setCurrentPage('nickname');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      clearResultId();
      clearPreLoginResult();
    } catch {
      // ignore
    }
  }, [setCurrentPage]);

  const value: AppState = {
    nickname,
    setNickname,
    currentPage,
    previousPage,
    setCurrentPage,
    answers,
    addAnswer,
    resetAnswers,
    residentKey,
    setResidentKey,
    secondResidentKey,
    setSecondResidentKey,
    selectedResultId,
    setSelectedResultId,
    selectedResidentKey,
    setSelectedResidentKey,
    sharedResultId,
    setSharedResultId,
    sharedResultScope,
    restart,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
