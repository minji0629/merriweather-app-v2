import { useState } from 'react';
import { useAuth } from '@/store/useAuth';
import { useApp } from '@/store/useApp';
import { X } from '@/components/Icons';

export function LoginModal() {
  const { isLoginOpen, hideLogin, login } = useAuth();
  const { currentPage } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoginOpen) return null;

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(currentPage);
      hideLogin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '로그인에 실패했어요.';
      console.warn('[Kakao] login failed:', e);
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={hideLogin} />
      <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6">
        <button
          onClick={hideLogin}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-text-sub hover:text-text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="font-batang text-xl text-text mb-2">메리웨더의 주민이 되어주세요</h2>
        <p className="font-sans text-sm text-text-sub mb-6">
          카카오 계정으로 간편하게 메리웨더 주민이 될 수 있어요.
        </p>

        {error && (
          <p className="font-sans text-xs text-red-500 text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 bg-[#FEE500] text-[#3C1E1E] rounded-2xl font-sans font-bold text-base
                     shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95
                     disabled:opacity-60 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#3C1E1E]/30 border-t-[#3C1E1E] rounded-full animate-spin" />
              이동 중...
            </span>
          ) : (
            <>
              <span className="text-lg">카</span>
              메리웨더 주민 되기
            </>
          )}
        </button>
      </div>
    </div>
  );
}
