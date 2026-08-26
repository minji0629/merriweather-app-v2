/*
# Merriweather 핵심 테이블 생성

## 변경 내용 요약
이 마이그레이션은 메리웨더 서비스의 데이터를 저장할 5개의 핵심 테이블을 생성합니다.
이 앱은 카카오 로그인을 사용하고 Supabase 익명 키(anon key)로 데이터에 접근하므로,
모든 정책은 `anon, authenticated` 역할에 대해 열려 있습니다.

## 새 테이블

### 1. users (사용자)
- `id` (text, 기본키) — 카카오 고유 ID (문자열)
- `nickname` (text, 필수) — 카카오 닉네임
- `email` (text, 선택) — 이메일
- `marketing_kakao` (boolean, 기본값 false) — 알림톡 수신 동의
- `marketing_email` (boolean, 기본값 false) — 이메일 수신 동의
- `created_at` (timestamptz, 기본값 now)

### 2. results (결과)
- `id` (uuid, 기본키) — 결과 고유 ID
- `user_id` (text, 필수, 외래키 → users.id) — 사용자 ID
- `resident_key` (text, 필수) — 주민 키 (예: guardian)
- `answers` (jsonb, 기본값 {}) — 25문항 답변 JSON
- `is_paid` (boolean, 기본값 false) — 유료 결과 여부
- `created_at` (timestamptz, 기본값 now)

### 3. purchases (결제 내역)
- `id` (uuid, 기본키) — 결제 고유 ID
- `user_id` (text, 필수, 외래키 → users.id) — 사용자 ID
- `product_type` (text, 필수) — 상품 유형 (탐험권 / 탐험권+추가질문)
- `amount` (integer, 필수) — 결제 금액
- `payment_key` (text, 필수) — 토스페이먼츠 결제 키
- `order_id` (text, 필수) — 주문 ID
- `created_at` (timestamptz, 기본값 now)

### 4. gift_codes (선물 코드)
- `id` (uuid, 기본키) — 선물 코드 고유 ID
- `code` (text, 필수) — 6자리 선물 코드
- `link_token` (text, 필수) — 1회용 링크 토큰
- `buyer_id` (text, 외래키 → users.id, 삭제 시 NULL) — 구매자 ID
- `receiver_name` (text) — 받는 사람 이름
- `message` (text) — 선물 메시지
- `product_type` (text, 필수) — 상품 유형
- `is_link_used` (boolean, 기본값 false) — 링크 사용 여부
- `is_code_used` (boolean, 기본값 false) — 코드 사용 여부
- `expires_at` (timestamptz, 필수) — 유효기간 (6개월)
- `created_at` (timestamptz, 기본값 now)

### 5. questions (추가 질문)
- `id` (uuid, 기본키) — 질문 설정 고유 ID
- `user_id` (text, 필수, 외래키 → users.id) — 사용자 ID
- `result_id` (uuid, 필수, 외래키 → results.id) — 결과 ID
- `remaining_count` (integer, 기본값 3) — 남은 질문 횟수
- `created_at` (timestamptz, 기본값 now)

## 보안 (RLS)
- 모든 테이블에 RLS 활성화
- 이 앱은 카카오 로그인을 사용하고 Supabase 익명 키로 접근하므로,
  모든 정책은 `anon, authenticated` 역할에 대해 열려 있습니다.
- 각 테이블마다 SELECT / INSERT / UPDATE (필요시 DELETE) 정책을 별도로 생성

## 인덱스
- results: user_id, created_at DESC
- purchases: user_id, order_id
- gift_codes: code, link_token, buyer_id
- questions: user_id, result_id

## 주의사항
1. 이 앱은 Supabase Auth 대신 카카오 로그인을 사용합니다. 따라서 auth.uid()가 아닌
   익명 키 기반 접근을 허용하는 정책을 사용합니다.
2. 모든 정책은 IF NOT EXISTS를 지원하지 않으므로 DROP POLICY IF EXISTS 후 생성합니다.
3. 외래키는 사용자 삭제 시 관련 데이터도 삭제(CASCADE)하거나 NULL로 설정(SET NULL)합니다.
*/

-- ============================================================
-- 1. users 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  nickname text NOT NULL,
  email text,
  marketing_kakao boolean NOT NULL DEFAULT false,
  marketing_email boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 2. results 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resident_key text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_results" ON results;
CREATE POLICY "anon_select_results" ON results FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_results" ON results;
CREATE POLICY "anon_insert_results" ON results FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_results" ON results;
CREATE POLICY "anon_update_results" ON results FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);

-- ============================================================
-- 3. purchases 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_type text NOT NULL,
  amount integer NOT NULL,
  payment_key text NOT NULL,
  order_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_purchases" ON purchases;
CREATE POLICY "anon_select_purchases" ON purchases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_purchases" ON purchases;
CREATE POLICY "anon_insert_purchases" ON purchases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON purchases(order_id);

-- ============================================================
-- 4. gift_codes 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS gift_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  link_token text NOT NULL,
  buyer_id text REFERENCES users(id) ON DELETE SET NULL,
  receiver_name text,
  message text,
  product_type text NOT NULL,
  is_link_used boolean NOT NULL DEFAULT false,
  is_code_used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gift_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gift_codes" ON gift_codes;
CREATE POLICY "anon_select_gift_codes" ON gift_codes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gift_codes" ON gift_codes;
CREATE POLICY "anon_insert_gift_codes" ON gift_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gift_codes" ON gift_codes;
CREATE POLICY "anon_update_gift_codes" ON gift_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_link_token ON gift_codes(link_token);
CREATE INDEX IF NOT EXISTS idx_gift_codes_buyer_id ON gift_codes(buyer_id);

-- ============================================================
-- 5. questions 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result_id uuid NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  remaining_count integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_questions" ON questions;
CREATE POLICY "anon_select_questions" ON questions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_questions" ON questions;
CREATE POLICY "anon_insert_questions" ON questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_questions" ON questions;
CREATE POLICY "anon_update_questions" ON questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_result_id ON questions(result_id);