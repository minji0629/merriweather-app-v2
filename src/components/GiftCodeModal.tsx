import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';
import { useApp } from '@/store/useApp';
import { savePurchase, markResultPaid, fetchLatestResultId, upsertQuestions } from '@/lib/supabase';
import { X, Gift } from '@/components/Icons';

type Status = 'idle' | 'checking' | 'error' | 'success';

export function GiftCodeModal({ onClose }: { onClose: () => void }) {
  const { user, login } = useAuth();
  const { setCurrentPage, currentPage } = useApp();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleRedeem = async () => {
    const TAG = '[GiftCode]';
    console.log(`${TAG} === 선물 코드 입력 시작 ===`);
    console.log(`${TAG} 로그인 상태:`, user ? `로그인됨 (id=${user.id}, nickname=${user.nickname})` : '비로그인');

    // ── Step 0: 로그인 확인 ──
    if (!user) {
      console.log(`${TAG} Step 0: 로그인 필요 — login() 호출 후 종료`);
      login(currentPage);
      return;
    }
    console.log(`${TAG} Step 0: 로그인 확인 통과`);

    // ── Step 1: 코드 형식 검증 ──
    const trimmed = code.trim().toUpperCase();
    console.log(`${TAG} Step 1: 입력된 코드="${trimmed}"`);
    if (!/^[A-Z0-9]{8}$/.test(trimmed)) {
      console.warn(`${TAG} Step 1: 형식 불일치 (8자리 영문/숫자 아님)`);
      setStatus('error');
      setMessage('8자리 영문/숫자 코드를 입력해주세요.');
      return;
    }
    console.log(`${TAG} Step 1: 형식 검증 통과`);

    // ── Step 2: gift_codes 테이블에서 코드 조회 ──
    setStatus('checking');
    setMessage('');
    console.log(`${TAG} Step 2: gift_codes 테이블 조회 중... (code=${trimmed})`);

    try {
    const { data, error } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('code', trimmed)
      .maybeSingle();

    console.log(`${TAG} Step 2: 조회 결과:`, { data, error: error ? { message: error.message, code: error.code } : null });

    if (error) {
      console.error(`${TAG} Step 2: 조회 에러:`, error.message, '(code:', error.code + ')');
      setStatus('error');
      setMessage('유효하지 않은 코드예요.');
      return;
    }
    if (!data) {
      console.error(`${TAG} Step 2: 코드를 찾을 수 없음 — DB에 해당 code 행 없음`);
      setStatus('error');
      setMessage('유효하지 않은 코드예요.');
      return;
    }

    console.log(`${TAG} Step 2: 코드 조회 성공 — gift_code id=${data.id}, product_type="${data.product_type}", is_code_used=${data.is_code_used}, expires_at=${data.expires_at}`);

    // ── Step 3: 사용 여부 확인 ──
    if (data.is_code_used) {
      console.warn(`${TAG} Step 3: 이미 사용된 코드`);
      setStatus('error');
      setMessage('이미 사용된 코드예요.');
      return;
    }
    console.log(`${TAG} Step 3: 미사용 코드 확인`);

    // ── Step 4: 유효기간 확인 ──
    const now = new Date();
    const expires = new Date(data.expires_at);
    console.log(`${TAG} Step 4: 유효기간 확인 — 현재=${now.toISOString()}, 만료=${expires.toISOString()}, 유효=${now < expires}`);
    if (now >= expires) {
      console.warn(`${TAG} Step 4: 유효기간 만료`);
      setStatus('error');
      setMessage('유효기간이 지난 코드예요.');
      return;
    }
    console.log(`${TAG} Step 4: 유효기간 통과`);

    // ── Step 5: results 테이블에서 최신 result_id 조회 (코드 소각 전 확인) ──
    console.log(`${TAG} Step 5: fetchLatestResultId 호출 중... (user_id=${user.id})`);
    const latestId = await fetchLatestResultId(user.id);
    console.log(`${TAG} Step 5: fetchLatestResultId 결과=`, latestId);

    if (!latestId) {
      console.error(`${TAG} Step 5: results 행 없음 — 코드를 소각하지 않고 종료. 사용자가 먼저 퀴즈를 완료해야 함.`);
      setStatus('error');
      setMessage('결과를 찾을 수 없어요. 먼저 여행(퀴즈)을 완료한 뒤 코드를 입력해주세요.');
      return;
    }
    console.log(`${TAG} Step 5: result_id 확보=${latestId}`);

    // ── Step 6: product_type 정규화 ──
    const rawType = data.product_type ?? '';
    const normalizedType = rawType.includes('추가') || rawType.includes('plus')
      ? '탐험권+추가질문'
      : '탐험권';
    console.log(`${TAG} Step 6: product_type 정규화 — 원본="${rawType}" → 정규화="${normalizedType}"`);

    // ── Step 7: purchases 테이블에 결제 기록 저장 ──
    console.log(`${TAG} Step 7: savePurchase 호출 중... (user_id=${user.id}, product_type=${normalizedType}, amount=0)`);
    const purchaseOk = await savePurchase(
      user.id,
      normalizedType,
      0,
      `gift_${data.id}`,
      `gift_${data.code}`,
    );
    console.log(`${TAG} Step 7: savePurchase 결과=`, purchaseOk);
    if (!purchaseOk) {
      console.error(`${TAG} Step 7: savePurchase 실패 — 계속 진행`);
    }

    // ── Step 8: results 테이블 is_paid=true 업데이트 ──
    console.log(`${TAG} Step 8: markResultPaid 호출 중... (result_id=${latestId})`);
    const paidOk = await markResultPaid(latestId);
    console.log(`${TAG} Step 8: markResultPaid 결과=`, paidOk);
    if (!paidOk) {
      console.error(`${TAG} Step 8: markResultPaid 실패 — 계속 진행`);
    }

    // ── Step 9: questions 테이블 행 생성 ──
    console.log(`${TAG} Step 9: upsertQuestions 호출 중... (user_id=${user.id}, result_id=${latestId}, product_type=${normalizedType})`);
    const qRow = await upsertQuestions(user.id, latestId, normalizedType);
    console.log(`${TAG} Step 9: upsertQuestions 결과=`, qRow);
    if (!qRow) {
      console.error(`${TAG} Step 9: upsertQuestions 실패 — questions 행이 생성되지 않음!`);
      setStatus('error');
      setMessage('질문 권한 생성에 실패했어요. 관리자에게 문의해주세요.');
      return;
    }
    console.log(`${TAG} Step 9: questions 행 생성 성공 — id=${qRow.id}, remaining_count=${qRow.remaining_count}`);

    // ── Step 10: gift_codes 테이블에 코드 사용 처리 (모든 단계 성공 후) ──
    console.log(`${TAG} Step 10: gift_codes is_code_used=true 업데이트 중... (id=${data.id})`);
    const { error: updateError } = await supabase
      .from('gift_codes')
      .update({ is_code_used: true })
      .eq('id', data.id);

    if (updateError) {
      console.error(`${TAG} Step 10: is_code_used 업데이트 실패:`, updateError.message);
    } else {
      console.log(`${TAG} Step 10: is_code_used=true 업데이트 성공`);
    }

    // ── 완료 ──
    console.log(`${TAG} === 선물 코드 입력 완료 — premium 페이지로 이동 ===`);
    setStatus('success');
    setMessage('선물 코드가 인증되었어요!');
    setTimeout(() => {
      onClose();
      setCurrentPage('premium');
    }, 1200);
    } catch (err) {
      console.error(`${TAG} 예외 발생:`, err);
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
