import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://ngxnorloveputcddltmf.supabase.co';
const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_URL;
const supabaseUrl = rawUrl.includes('rokseacezmaeiwvzmogx') ? FALLBACK_URL : rawUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[Supabase] 환경변수가 설정되지 않았습니다.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserRow {
  id: string;
  nickname: string;
  email: string | null;
  marketing_kakao: boolean;
  marketing_email: boolean;
  created_at: string;
}

export interface ResultRow {
  id: string;
  user_id: string;
  resident_key: string;
  answers: Record<string, unknown>;
  is_paid: boolean;
  ai_result: string | null;
  ai_letter: string | null;
  ai_relation: string | null;
  ai_growth: string | null;
  product_type: string | null;
  created_at: string;
}

export interface PurchaseRow {
  id: string;
  user_id: string;
  product_type: string;
  amount: number;
  payment_key: string;
  order_id: string;
  created_at: string;
}

export interface GiftCodeRow {
  id: string;
  code: string;
  link_token: string;
  buyer_id: string | null;
  receiver_name: string;
  message: string;
  product_type: string;
  is_link_used: boolean;
  is_code_used: boolean;
  expires_at: string;
  created_at: string;
}

export interface QuestionHistoryEntry {
  question: string;
  answer: string;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  user_id: string;
  result_id: string;
  remaining_count: number;
  question_history: QuestionHistoryEntry[] | null;
  created_at: string;
}

export async function upsertUser(
  userId: string,
  nickname: string,
  marketing: { kakao: boolean; email: boolean },
  email?: string,
): Promise<UserRow | null> {
  const id = String(userId);
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id,
        nickname,
        email: email ?? null,
        marketing_kakao: marketing.kakao,
        marketing_email: marketing.email,
      },
      { onConflict: 'id' },
    )
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Supabase] upsertUser error:', error.message);
    return null;
  }
  return data as UserRow | null;
}

export async function saveFreeResult(
  userId: string,
  residentKey: string,
  answers: Record<string, unknown>,
): Promise<ResultRow | null> {
  const { data, error } = await supabase
    .from('results')
    .insert({
      user_id: userId,
      resident_key: residentKey,
      answers,
      is_paid: false,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Supabase] saveFreeResult error:', error.message);
    return null;
  }
  return data as ResultRow | null;
}

export async function savePurchase(
  userId: string,
  productType: string,
  amount: number,
  paymentKey: string,
  orderId: string,
): Promise<PurchaseRow | null> {
  const { data: existing } = await supabase
    .from('purchases')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (existing) {
    console.log('[Supabase] savePurchase - 이미 존재하는 주문:', orderId);
    return existing as PurchaseRow | null;
  }

  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      product_type: productType,
      amount,
      payment_key: paymentKey,
      order_id: orderId,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Supabase] savePurchase error:', error.message);
    return null;
  }
  return data as PurchaseRow | null;
}

export async function markResultPaid(resultId: string, productType?: string): Promise<boolean> {
  const update: Record<string, unknown> = { is_paid: true };
  if (productType) update.product_type = productType;
  const { data, error } = await supabase
    .from('results')
    .update(update)
    .eq('id', resultId)
    .select('id, is_paid, product_type')
    .maybeSingle();

  if (error) {
    console.error('[Supabase] markResultPaid error:', error.message);
    return false;
  }
  if (!data) {
    console.warn('[Supabase] markResultPaid - 업데이트된 행 없음, result_id:', resultId);
    return false;
  }
  console.log('[Supabase] markResultPaid 성공:', data);
  return true;
}

function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
  for (let i = 0; i < length; i++) {
    if (cryptoObj) {
      const arr = new Uint32Array(1);
      cryptoObj.getRandomValues(arr);
      result += chars[arr[0] % chars.length];
    } else {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

export async function createGiftCode(
  buyerId: string | null,
  recipientName: string,
  message: string,
  productType: string,
): Promise<GiftCodeRow | null> {
  const code = generateRandomCode(8);
  const linkToken = generateRandomCode(32);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const { data, error } = await supabase
    .from('gift_codes')
    .insert({
      code,
      link_token: linkToken,
      buyer_id: buyerId,
      receiver_name: recipientName,
      message,
      product_type: productType,
      is_link_used: false,
      is_code_used: false,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[Supabase] createGiftCode error:', error.message);
    return null;
  }
  return data as GiftCodeRow | null;
}

/** 비로그인 결과를 실제 계정으로 연결 (user_id 갱신) */
export async function linkResultToUser(
  resultId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('results')
    .update({ user_id: userId })
    .eq('id', resultId);
  if (error) {
    console.error('[Supabase] linkResultToUser error:', error.message);
    return false;
  }
  return true;
}

/** 비로그인 questions 행을 실제 계정으로 연결 (user_id 갱신) */
export async function linkQuestionsToUser(
  resultId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .update({ user_id: userId })
    .eq('result_id', resultId);
  if (error) {
    console.error('[Supabase] linkQuestionsToUser error:', error.message);
    return false;
  }
  return true;
}

export async function fetchLatestResultId(userId: string): Promise<string | null> {
  const { data: latest, error: selectError } = await supabase
    .from('results')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError || !latest) {
    console.error('[Supabase] fetchLatestResultId failed:', selectError?.message);
    return null;
  }
  return latest.id;
}

export async function markLatestResultPaid(userId: string): Promise<boolean> {
  const latestId = await fetchLatestResultId(userId);
  if (!latestId) return false;
  return markResultPaid(latestId);
}

export async function fetchUserResults(userId: string): Promise<ResultRow[]> {
  const { data, error } = await supabase
    .from('results')
    .select('id, user_id, resident_key, is_paid, ai_result, ai_letter, ai_relation, ai_growth, product_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] fetchUserResults error:', error.message);
    return [];
  }
  const rows = (data as ResultRow[]) ?? [];

  // purchases 테이블에 결제 기록이 있지만 is_paid가 false인 결과를 보정
  const unpaidRows = rows.filter((r) => !r.is_paid);
  if (unpaidRows.length > 0) {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('order_id, product_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (purchases && purchases.length > 0) {
      for (const row of unpaidRows) {
        // 결과 생성 시간과 가장 가까운 결제 기록 찾기
        const resultTime = new Date(row.created_at).getTime();
        const matchingPurchase = purchases.find((p) => {
          const purchaseTime = new Date(p.created_at).getTime();
          return Math.abs(purchaseTime - resultTime) < 10 * 60 * 1000; // 10분 이내
        });
        if (matchingPurchase) {
          console.log('[Supabase] fetchUserResults - is_paid 보정:', row.id, '→ product_type:', matchingPurchase.product_type);
          await markResultPaid(row.id, matchingPurchase.product_type);
          row.is_paid = true;
          row.product_type = matchingPurchase.product_type;
        }
      }
    }
  }

  return rows;
}

/** 특정 result_id로 단일 결과 행을 불러온다 (보관함에서 선택한 결과용) */
export async function fetchResultById(resultId: string): Promise<ResultRow | null> {
  const { data, error } = await supabase
    .from('results')
    .select('id, user_id, resident_key, is_paid, ai_result, ai_letter, ai_relation, ai_growth, product_type, created_at')
    .eq('id', resultId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] fetchResultById error:', error.message);
    return null;
  }
  return data as ResultRow | null;
}

/** results 테이블에 AI 생성 텍스트(결/편지/관계 나침반/성장 나침반)를 저장한다 */
export async function saveAiText(
  resultId: string,
  field: 'ai_result' | 'ai_letter' | 'ai_relation' | 'ai_growth',
  text: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('results')
    .update({ [field]: text })
    .eq('id', resultId);
  if (error) {
    console.error(`[Supabase] saveAiText (${field}) error:`, error.message);
    return false;
  }
  return true;
}

/** questions 테이블의 question_history에 질문/답변을 추가한다 */
export async function appendQuestionHistory(
  questionId: string,
  entry: QuestionHistoryEntry,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('questions')
    .select('question_history')
    .eq('id', questionId)
    .maybeSingle();
  if (error) {
    console.error('[Supabase] appendQuestionHistory fetch error:', error.message);
    return false;
  }
  const existing = (data?.question_history as QuestionHistoryEntry[] | null) ?? [];
  const updated = [...existing, entry];
  const { error: updateError } = await supabase
    .from('questions')
    .update({ question_history: updated })
    .eq('id', questionId);
  if (updateError) {
    console.error('[Supabase] appendQuestionHistory update error:', updateError.message);
    return false;
  }
  return true;
}

/**
 * 상품별 초기 질문 횟수
 * expedition: 1, expedition_plus: 3, extra_questions: +3 추가
 */
const INITIAL_COUNTS: Record<string, number> = {
  '탐험권': 1,
  '탐험권+추가질문': 3,
};

/**
 * 결제 완료 시 questions 행 생성 또는 횟수 추가.
 * extra_questions는 기존 행의 remaining_count에 3을 더함.
 */
export async function upsertQuestions(
  userId: string,
  resultId: string,
  productType: string,
): Promise<QuestionRow | null> {
  // 기존 행이 있는지 먼저 확인 (중복 생성 방지)
  const { data: existing } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .eq('result_id', resultId)
    .maybeSingle();

  if (productType === '추가질문') {
    if (existing) {
      const { data, error } = await supabase
        .from('questions')
        .update({ remaining_count: existing.remaining_count + 3 })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) {
        console.error('[Supabase] upsertQuestions(extra) error:', error.message);
        return null;
      }
      return data as QuestionRow | null;
    }
    const { data, error } = await supabase
      .from('questions')
      .insert({ user_id: userId, result_id: resultId, remaining_count: 3 })
      .select()
      .maybeSingle();
    if (error) {
      console.error('[Supabase] upsertQuestions(extra-new) error:', error.message);
      return null;
    }
    return data as QuestionRow | null;
  }

  if (existing) {
    const newCount = INITIAL_COUNTS[productType] ?? 1;
    if (newCount > existing.remaining_count) {
      const { data, error } = await supabase
        .from('questions')
        .update({ remaining_count: newCount })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (error) {
        console.error('[Supabase] upsertQuestions(upgrade) error:', error.message);
        return existing as QuestionRow | null;
      }
      return (data as QuestionRow | null) ?? existing;
    }
    return existing as QuestionRow | null;
  }

  const count = INITIAL_COUNTS[productType] ?? 1;
  const { data, error } = await supabase
    .from('questions')
    .insert({ user_id: userId, result_id: resultId, remaining_count: count })
    .select()
    .maybeSingle();
  if (error) {
    console.error('[Supabase] upsertQuestions error:', error.message);
    return null;
  }
  return data as QuestionRow | null;
}

/** 사용자의 결과에 대한 질문 행 조회 */
export async function fetchQuestions(
  userId: string,
  resultId: string,
): Promise<QuestionRow | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .eq('result_id', resultId)
    .maybeSingle();
  if (error) {
    console.error('[Supabase] fetchQuestions error:', error.message);
    return null;
  }
  return data as QuestionRow | null;
}

/** result_id 매칭 실패 시 user_id만으로 가장 최근 questions 행 조회 */
export async function fetchLatestQuestionsByUser(
  userId: string,
): Promise<QuestionRow | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[Supabase] fetchLatestQuestionsByUser error:', error.message);
    return null;
  }
  return data as QuestionRow | null;
}

/** questions 행이 없을 때 탐험권 구매자용 기본 1회 자동 생성 */
export async function createDefaultQuestions(
  userId: string,
  resultId: string,
  count = 1,
): Promise<QuestionRow | null> {
  const { data, error } = await supabase
    .from('questions')
    .insert({ user_id: userId, result_id: resultId, remaining_count: count })
    .select()
    .maybeSingle();
  if (error) {
    console.error('[Supabase] createDefaultQuestions error:', error.message);
    return null;
  }
  return data as QuestionRow | null;
}

/** 질문 1회 사용: remaining_count - 1. 이미 0이면 false 반환 */
export async function decrementQuestion(rowId: string, current: number): Promise<boolean> {
  if (current <= 0) return false;
  const { error } = await supabase
    .from('questions')
    .update({ remaining_count: current - 1 })
    .eq('id', rowId);
  if (error) {
    console.error('[Supabase] decrementQuestion error:', error.message);
    return false;
  }
  return true;
}

export interface DeveloperNoteRow {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface DeveloperNoteCommentRow {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  created_at: string;
  nickname?: string;
}

export async function fetchDeveloperNotes(): Promise<DeveloperNoteRow[]> {
  const { data, error } = await supabase
    .from('developer_notes')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchDeveloperNotes error:', error.message);
    return [];
  }
  return (data as DeveloperNoteRow[]) ?? [];
}

export async function fetchDeveloperNote(noteId: string): Promise<DeveloperNoteRow | null> {
  const { data, error } = await supabase
    .from('developer_notes')
    .select('id, title, content, created_at')
    .eq('id', noteId)
    .maybeSingle();
  if (error) {
    console.error('[Supabase] fetchDeveloperNote error:', error.message);
    return null;
  }
  return data as DeveloperNoteRow | null;
}

export async function createDeveloperNote(title: string, content: string): Promise<DeveloperNoteRow | null> {
  const { data, error } = await supabase
    .from('developer_notes')
    .insert({ title, content })
    .select()
    .maybeSingle();
  if (error) {
    console.error('[Supabase] createDeveloperNote error:', error.message);
    return null;
  }
  return data as DeveloperNoteRow | null;
}

export async function updateDeveloperNote(noteId: string, title: string, content: string): Promise<boolean> {
  const { error } = await supabase
    .from('developer_notes')
    .update({ title, content })
    .eq('id', noteId);
  if (error) {
    console.error('[Supabase] updateDeveloperNote error:', error.message);
    return false;
  }
  return true;
}

export async function deleteDeveloperNote(noteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('developer_notes')
    .delete()
    .eq('id', noteId);
  if (error) {
    console.error('[Supabase] deleteDeveloperNote error:', error.message);
    return false;
  }
  return true;
}

export async function fetchDeveloperNoteComments(noteId: string): Promise<DeveloperNoteCommentRow[]> {
  const { data, error } = await supabase
    .from('developer_note_comments')
    .select('id, note_id, user_id, content, created_at')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[Supabase] fetchDeveloperNoteComments error:', error.message);
    return [];
  }
  const comments = (data as DeveloperNoteCommentRow[]) ?? [];
  if (comments.length === 0) return comments;

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, nickname')
    .in('id', userIds);
  const userMap = new Map((users as { id: string; nickname: string }[] | null ?? []).map((u) => [u.id, u.nickname]));

  return comments.map((c) => ({
    ...c,
    nickname: userMap.get(c.user_id) ?? '익명',
  }));
}

export async function createDeveloperNoteComment(
  noteId: string,
  content: string,
): Promise<DeveloperNoteCommentRow | null> {
  const { data, error } = await supabase
    .from('developer_note_comments')
    .insert({ note_id: noteId, content })
    .select()
    .maybeSingle();
  if (error) {
    console.error('[Supabase] createDeveloperNoteComment error:', error.message);
    return null;
  }
  return data as DeveloperNoteCommentRow | null;
}

export async function deleteDeveloperNoteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('developer_note_comments')
    .delete()
    .eq('id', commentId);
  if (error) {
    console.error('[Supabase] deleteDeveloperNoteComment error:', error.message);
    return false;
  }
  return true;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData.session?.user?.id ?? null;
  const currentUserEmail = sessionData.session?.user?.email ?? null;
  const currentNickname =
    (sessionData.session?.user?.user_metadata?.nickname as string) ??
    (sessionData.session?.user?.user_metadata?.name as string) ??
    (sessionData.session?.user?.user_metadata?.full_name as string) ??
    null;
  console.log('[checkIsAdmin] user.id:', currentUserId, '/ email:', currentUserEmail, '/ nickname:', currentNickname);

  if (!currentUserId) {
    console.warn('[checkIsAdmin] 로그인된 사용자가 없습니다. 관리자 확인 불가.');
    return false;
  }

  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('[checkIsAdmin] is_admin() RPC 호출 실패:', error.message, '(code:', error.code + ')');
    return false;
  }
  console.log('[checkIsAdmin] is_admin() RPC 결과:', data, '/ 최종 반환:', data === true);
  return data === true;
}

export async function deleteResult(resultId: string, userId: string): Promise<boolean> {
  console.log('[Delete Result] 1. 삭제할 result id:', resultId, '/ user_id:', userId);
  console.log('[Delete Result] 2. Supabase delete 호출...');
  const { data, error } = await supabase
    .from('results')
    .delete()
    .eq('id', resultId)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('[Delete Result] 3. 삭제 실패:', error.message, '(code:', error.code + ')');
    return false;
  }
  console.log('[Delete Result] 3. 삭제 완료. 삭제된 행 수:', data?.length ?? 0);
  return true;
}

// ============================================================
// travel_posts (여행자 광장)
// ============================================================

export interface TravelPostRow {
  id: string;
  title: string;
  content: string;
  user_id: string;
  nickname: string;
  created_at: string;
}

export async function fetchTravelPosts(): Promise<TravelPostRow[]> {
  const { data, error } = await supabase
    .from('travel_posts')
    .select('id, title, content, user_id, nickname, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchTravelPosts error:', error.message);
    return [];
  }
  return (data as TravelPostRow[]) ?? [];
}

export async function createTravelPost(
  title: string,
  content: string,
  nickname: string,
): Promise<TravelPostRow | null> {
  const { data, error } = await supabase
    .from('travel_posts')
    .insert({ title, content, nickname })
    .select()
    .maybeSingle();
  if (error) {
    console.error('[Supabase] createTravelPost error:', error.message);
    return null;
  }
  return data as TravelPostRow | null;
}

export async function deleteTravelPost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('travel_posts')
    .delete()
    .eq('id', postId);
  if (error) {
    console.error('[Supabase] deleteTravelPost error:', error.message);
    return false;
  }
  return true;
}
