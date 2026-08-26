import { useEffect, useState } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { PageContainer } from '@/components/PageContainer';
import { Sparkles, Compass, Lock, X } from '@/components/Icons';
import { supabase, fetchUserResults, fetchResultById, deleteResult, ResultRow } from '@/lib/supabase';
import { RESIDENTS } from '@/constants/residents';
import { RESIDENT_IMAGES } from '@/constants/images';
import type { ResidentKey } from '@/constants/questions';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function ArchivePage() {
  const { setCurrentPage, setSelectedResultId, setSelectedResidentKey } = useApp();
  const { user, login } = useAuth();
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadResults = async (userId: string) => {
    console.log('[Results] Archive - fetchUserResults 호출:', { userId });
    const rows = await fetchUserResults(userId);
    console.log('[Results] Archive - fetchUserResults 결과:', rows.length, '건');
    setResults(rows);
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      const userId = sessionData.session?.user.id ?? user.id;
      await loadResults(userId);
    })();
    return () => { mounted = false; };
  }, [user]);

  const handleView = async (row: ResultRow, target: 'result' | 'premium' | 'payment') => {
    console.log('[Archive] 클릭한 result_id:', row.id);
    setSelectedResultId(row.id);

    const fetched = await fetchResultById(row.id);
    console.log('[Archive] Supabase에서 불러온 데이터:', fetched);

    const key = (fetched?.resident_key ?? row.resident_key) as ResidentKey | null;
    setSelectedResidentKey(key);
    console.log('[Archive] 실제 표시되는 주민 키:', key);

    setCurrentPage(target);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId || !user) return;
    setIsDeleting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id ?? user.id;
    const ok = await deleteResult(deletingId, userId);
    setIsDeleting(false);
    if (ok) {
      setDeletingId(null);
      await loadResults(userId);
    }
  };

  // 비로그인
  if (!user) {
    return (
      <PageContainer className="bg-base">
        <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
          <div className="px-6 pt-10 pb-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setCurrentPage('landing')}
                className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub hover:text-text transition-colors"
              >
                MERRIWEATHER
              </button>
              <span className="font-sans text-sm text-text-sub">보관함</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-24 animate-fadeUp">
              <div className="w-20 h-20 rounded-full bg-point/15 flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-point" />
              </div>
              <h1 className="font-batang text-2xl text-text mb-3">로그인 후 이용할 수 있어요.</h1>
              <p className="font-sans text-sm text-text-sub mb-8">
                지금까지의 여행 기록을 언제든 다시 만나보세요.
              </p>
              <button
                onClick={() => login('archive')}
                className="px-8 py-4 bg-[#FEE500] text-[#3C1E1E] rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95"
              >
                메리웨더 주민 되기
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 로딩 중
  if (results === null) {
    return (
      <PageContainer className="bg-base">
        <div className="flex items-center justify-center flex-1 min-h-0">
          <div className="flex items-center gap-2 text-point-dark">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="font-sans text-sm">기록을 불러오는 중...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-base">
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
            <span className="font-sans text-sm text-text-sub">보관함</span>
          </div>

          <h1 className="font-batang text-2xl text-text mb-1 animate-fadeUp">나의 여행 기록</h1>
          <p className="font-sans text-sm text-text-sub mb-8 animate-fadeUp" style={{ animationDelay: '0.1s', opacity: 0 }}>
            지금까지 만난 주민들을 다시 만나보세요.
          </p>

          {/* 결과 없음 */}
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <div className="w-20 h-20 rounded-full bg-point/15 flex items-center justify-center mb-6">
                <Compass className="w-10 h-10 text-point" />
              </div>
              <h2 className="font-batang text-xl text-text mb-3">아직 여행 기록이 없어요.</h2>
              <p className="font-sans text-sm text-text-sub mb-8">
                첫 여행을 시작해보세요.
              </p>
              <button
                onClick={() => setCurrentPage('landing')}
                className="px-8 py-4 bg-point text-white rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl active:scale-95"
              >
                첫 여행 시작하기
              </button>
            </div>
          ) : (
            /* 결과 카드 목록 */
            <div className="space-y-4">
              {results.map((row, i) => {
                const profile = RESIDENTS[row.resident_key as ResidentKey];
                if (!profile) return null;
                const delay = `${0.15 + i * 0.08}s`;
                return (
                  <div
                    key={row.id}
                    className="p-5 bg-white rounded-2xl border border-[#E0DDD8] shadow-sm
                               transition-all duration-300 hover:shadow-md animate-fadeUp"
                    style={{ animationDelay: delay, opacity: 0 }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-point-light/40 to-point/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {RESIDENT_IMAGES[row.resident_key] ? (
                          <img src={RESIDENT_IMAGES[row.resident_key]} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{profile.emoji}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-batang text-lg text-text truncate">{profile.name}</h3>
                        <p className="font-sans text-xs text-text-sub mt-1">{formatDate(row.created_at)}</p>
                      </div>
                      {row.is_paid && (
                        <span className="flex-shrink-0 px-2.5 py-1 bg-golden/20 text-golden text-xs font-sans font-bold rounded-full border border-golden/30">
                          탐험권
                        </span>
                      )}
                      <button
                        onClick={() => setDeletingId(row.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-text-sub
                                   hover:bg-red-50 hover:text-red-500 transition-all duration-300 active:scale-90"
                        aria-label="삭제"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(row, 'result')}
                        className="flex-1 py-3 bg-white border border-[#E0DDD8] rounded-xl font-sans text-sm text-text
                                   hover:border-point hover:text-point transition-all duration-300 active:scale-95"
                      >
                        무료 결과 보기
                      </button>
                      {row.is_paid ? (
                        <button
                          onClick={() => handleView(row, 'premium')}
                          className="flex-1 py-3 bg-point text-white rounded-xl font-sans font-bold text-sm
                                     shadow-sm transition-all duration-300 hover:bg-point-dark hover:shadow-md active:scale-95
                                     flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          탐험권 결과 보기
                        </button>
                      ) : (
                        <button
                          onClick={() => handleView(row, 'payment')}
                          className="flex-1 py-3 bg-point/10 text-point-dark rounded-xl font-sans font-bold text-sm
                                     border border-point/30 transition-all duration-300 hover:bg-point/20 active:scale-95
                                     flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          탐험권 구매하기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단: 새로운 여행 시작하기 */}
        <div className="px-6 pb-8">
          <button
            onClick={() => setCurrentPage('landing')}
            className="w-full py-4 bg-point text-white rounded-2xl font-sans font-bold text-base
                       shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl hover:scale-[1.02] active:scale-95
                       flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5" />
            새로운 여행 시작하기
          </button>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeletingId(null)} />
          <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="font-batang text-xl text-text mb-2">이 여행 기록을 삭제할까요?</h2>
            <p className="font-sans text-sm text-text-sub mb-6">
              삭제한 기록은 다시 볼 수 없어요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="flex-1 py-3.5 bg-white border border-[#E0DDD8] rounded-2xl font-sans font-medium text-sm text-text
                           hover:bg-base transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-sans font-bold text-sm
                           shadow-lg transition-all duration-300 hover:bg-red-600 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
