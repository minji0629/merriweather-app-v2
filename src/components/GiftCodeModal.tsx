import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { useApp } from '@/store/useApp';
import { savePurchase, markResultPaid, fetchLatestResultId, upsertQuestions } from '@/lib/supabase';
import { X, Gift } from '@/components/Icons';

type Status = 'idle' | 'checking' | 'error' | 'success';

export function GiftCodeModal({ onClose }: { onClose: () => void }) {
  const { user, login } = useAuth();
  const { setCurrentPage, currentPage, setSelectedResultId } = useApp();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleRedeem = async () => {
    const TAG = '[GiftCode]';

    // ── Step 0: 로그인 확인 ──
    if (!user) {
      login(currentPage);
      return;
    }

    // ── Step 1: 코드 형식 검증 ──
    const trimmed = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(trimmed)) {
      setStatus('error');
      setMessage('8자리 영문/숫자 코드를 입력해주세요.');
      return;
    }

    // ── Step 2: gift_codes 테이블에서 코드 조회 ──
    setStatus('checking');
    setMessage('');

    try {
    const { data, error } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('code', trimmed)
      .maybeSingle();


    if (error) {
      setStatus('error');
      setMessage('유효하지 않은 코드예요.');
      return;
    }
    if (!data) {
      setStatus('error');
      setMessage('유효하지 않은 코드예요.');
      return;
    }


    // ── Step 3: 사용 여부 확인 ──
    if (data.is_code_used) {
      setStatus('error');
      setMessage('이미 사용된 코드예요.');
      return;
    }

    // ── Step 4: 유효기간 확인 ──
    const now = new Date();
    const expires = new Date(data.expires_at);
    if (now >= expires) {
      setStatus('error');
      setMessage('유효기간이 지난 코드예요.');
      return;
    }

    // ── Step 5: results 테이블에서 최신 result_id 조회 (코드 소각 전 확인) ──
    const latestId = await fetchLatestResultId(user.id);

    if (!latestId) {
      setStatus('error');
      setMessage('결과를 찾을 수 없어요. 먼저 여행(퀴즈)을 완료한 뒤 코드를 입력해주세요.');
      return;
    }

    // ── Step 6: product_type 정규화 ──
    const rawType = data.product_type ?? '';
    const normalizedType = rawType.includes('추가') || rawType.includes('plus')
      ? '탐험권+추가질문'
      : '탐험권';

    // ── Step 7: purchases 테이블에 결제 기록 저장 ──
    const purchaseOk = await savePurchase(
      user.id,
      normalizedType,
      0,
      `gift_${data.id}`,
      `gift_${data.code}`,
    );
    if (!purchaseOk) {
    }

    // ── Step 8: results 테이블 is_paid=true + product_type 업데이트 ──
    const paidOk = await markResultPaid(latestId, normalizedType);
    if (!paidOk) {
    }

    // ── Step 9: questions 테이블 행 생성 ──
    const qRow = await upsertQuestions(user.id, latestId, normalizedType);
    if (!qRow) {
      setStatus('error');
      setMessage('질문 권한 생성에 실패했어요. 관리자에게 문의해주세요.');
      return;
    }

    // ── Step 10: gift_codes 테이블에 코드 사용 처리 (모든 단계 성공 후) ──
    const { error: updateError } = await supabase
      .from('gift_codes')
      .update({ is_code_used: true })
      .eq('id', data.id);

    if (updateError) {
    } else {
    }

    // ── 완료 ──
    setSelectedResultId(latestId);
    setStatus('success');
    setMessage('선물 코드가 인증되었어요!');
    setTimeout(() => {
      onClose();
      setCurrentPage('premium');
    }, 1200);
    } catch (err) {
      setStatus('error');
      setMessage('처리 중 오류가 발생했어요. 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-sub hover:text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-point/15 flex items-center justify-center">
            <Gift className="w-6 h-6 text-point-dark" />
          </div>
          <h2 className="font-batang text-xl text-text mb-1">선물 코드 입력하기</h2>
          <p className="font-sans text-xs text-text-sub">
            {user ? '받으신 8자리 코드를 입력해주세요.' : '코드를 입력하려면 먼저 로그인해주세요.'}
          </p>
        </div>

        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
            setStatus('idle');
            setMessage('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          placeholder="ABCD1234"
          maxLength={8}
          className="w-full px-5 py-4 bg-white/80 rounded-2xl font-sans text-lg text-center tracking-[0.3em] text-text
                     placeholder:text-text-sub/40 border border-[#E0DDD8] shadow-sm
                     focus:border-point focus:shadow-md transition-all duration-300"
        />

        {message && (
          <p
            className={`mt-3 font-sans text-sm text-center ${
              status === 'success' ? 'text-point-dark' : 'text-red-500'
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-5 space-y-2">
          <button
            onClick={handleRedeem}
            disabled={status === 'checking' || code.length !== 8}
            className="w-full py-4 bg-point text-white rounded-2xl font-sans font-medium text-base
                       shadow-lg transition-all duration-300 hover:bg-point-dark hover:shadow-xl active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'checking' ? '확인 중...' : user ? '코드 확인' : '로그인하기'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 font-sans text-sm text-text-sub hover:text-text transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
