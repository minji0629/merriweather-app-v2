import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';

export function NoticePage() {
  const { setCurrentPage } = useApp();

  return (
    <PageContainer className="bg-base">
      <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
        <div className="px-6 pt-10 pb-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-batang text-lg text-text hover:text-point transition-colors"
            >
              MERRIWEATHER
            </button>
            <span className="font-sans text-sm text-text-sub">공지사항</span>
          </div>

          {/* Title */}
          <h1 className="font-batang text-2xl text-text mb-8 animate-fadeUp">공지사항</h1>

          {/* Notice list */}
          <div className="space-y-4">
            <article
              className="p-5 bg-white rounded-2xl border border-[#E0DDD8] shadow-sm animate-fadeUp"
              style={{ animationDelay: '0.1s', opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📌</span>
                <span className="px-2.5 py-1 bg-point/10 text-point-dark text-xs font-sans font-bold rounded-full">
                  [안내]
                </span>
              </div>
              <h2 className="font-batang text-lg text-text mb-2">메리웨더 출시 예정</h2>
              <p className="font-sans text-xs text-text-sub mb-4">2026년 8월</p>
              <div className="space-y-2">
                <p className="font-sans text-sm text-text leading-relaxed">
                  메리웨더가 곧 여러분을 찾아갑니다.
                </p>
                <p className="font-sans text-sm text-text leading-relaxed">
                  나를 찾아 떠나는 여행, 기억의 숲에서 만나요.
                </p>
                <p className="font-sans text-sm text-text-sub leading-relaxed">
                  2026년 9월 정식 오픈 예정입니다.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
