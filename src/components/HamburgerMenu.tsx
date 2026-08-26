import { useState } from 'react';
import { useAuth } from '@/store/useAuth';
import { useApp } from '@/store/useApp';

export function HamburgerMenu() {
  const { user, logout, login } = useAuth();
  const { setCurrentPage, currentPage } = useApp();
  const [open, setOpen] = useState(false);
  const [showGiftLogin, setShowGiftLogin] = useState(false);

  const handleLoginClick = async () => {
    setOpen(false);
    try {
      await login(currentPage);
    } catch (e) {
      console.warn('[Kakao] login failed:', e);
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    setOpen(false);
  };

  const handleNavigate = (page: 'landing' | 'nickname' | 'archive' | 'gift' | 'notice' | 'contact' | 'terms' | 'privacy' | 'developerNote' | 'travelPlaza') => {
    setOpen(false);
    setCurrentPage(page);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-[60] w-11 h-11 flex flex-col items-center justify-center gap-1.5
                   active:scale-90 transition-transform duration-200"
        aria-label="메뉴"
      >
        <span className="w-5 h-0.5 bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
        <span className="w-5 h-0.5 bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
        <span className="w-5 h-0.5 bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 z-[70] w-64 h-full bg-base shadow-2xl animate-slideIn flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#E0DDD8]">
              <span className="font-batang text-lg text-text">메뉴</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-text-sub hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
              {/* 로그인 / 로그아웃 */}
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-point/15 flex items-center justify-center">
                      <span className="font-batang text-sm text-point-dark">
                        {user.nickname.charAt(0)}
                      </span>
                    </div>
                    <span className="font-sans text-sm text-text">{user.nickname}님</span>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text-sub
                               hover:bg-point/5 hover:text-text transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text
                             hover:bg-point/5 transition-colors"
                >
                  메리웨더 주민 되기
                </button>
              )}

              <div className="my-1 h-px shrink-0 bg-[#E0DDD8]" />

              {/* 보관함 */}
              <button
                onClick={() => handleNavigate('archive')}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                나의 여행 기록
              </button>

              {/* 선물하기 */}
              <button
                onClick={() => {
                  if (!user) {
                    setOpen(false);
                    setShowGiftLogin(true);
                  } else {
                    handleNavigate('gift');
                  }
                }}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                탐험권 선물하기
              </button>

              <div className="my-1 h-px shrink-0 bg-[#E0DDD8]" />

              {/* 메리웨더 소식 */}
              <button
                onClick={() => handleNavigate('notice')}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                메리웨더 소식
              </button>

              {/* 개발자 노트 */}
              <button
                onClick={() => handleNavigate('developerNote')}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                개발자 노트
              </button>

              {/* 여행자 광장 */}
              <button
                onClick={() => handleNavigate('travelPlaza')}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                여행자 광장
              </button>

              {/* 문의하기 */}
              <button
                onClick={() => handleNavigate('contact')}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                문의하기
              </button>

              <div className="my-1 h-px shrink-0 bg-[#E0DDD8]" />

              {/* 이용약관 */}
              <button
                onClick={() => handleNavigate('terms')}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                이용약관
              </button>

              {/* 개인정보처리방침 */}
              <button
                onClick={() => handleNavigate('privacy')}
                className="w-full text-left px-4 py-3 rounded-xl font-sans text-sm text-text hover:bg-point/5 transition-colors"
              >
                개인정보처리방침
              </button>
            </div>
          </div>
        </>
      )}

      {showGiftLogin && !user && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGiftLogin(false)} />
          <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6 text-center">
            <h2 className="font-batang text-xl text-text mb-2">선물하기를 위해 주민 인증이 필요해요</h2>
            <p className="font-sans text-sm text-text-sub mb-6">
              메리웨더 주민이 되면 소중한 사람에게 탐험권을 선물할 수 있어요.
            </p>
            <button
              onClick={() => {
                setShowGiftLogin(false);
                login(currentPage);
              }}
              className="w-full py-4 bg-[#FEE500] text-[#3C1E1E] rounded-2xl font-sans font-bold text-base
                         shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95"
            >
              메리웨더 주민 되기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
