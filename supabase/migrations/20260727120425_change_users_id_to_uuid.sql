/*
# Change users.id column type from text to uuid

## 변경 내용 요약
카카오 로그인 방식을 Supabase Auth OAuth로 변경함에 따라,
users 테이블의 id 컬럼 타입을 text에서 uuid로 변경합니다.
Supabase Auth는 사용자 ID로 UUID를 사용합니다.

## 변경되는 테이블
### users
- `id` 컬럼 타입: text → uuid
- 외래키 제약조건도 함께 업데이트됩니다 (CASCADE/SET NULL 유지)

## 주의사항
1. 기존 데이터가 없는 상태에서 실행되므로 데이터 손실이 없습니다.
2. 외래키로 users.id를 참조하는 results, purchases, gift_codes, questions 테이블의
   컬럼도 함께 uuid로 변경됩니다.
3. 모든 정책은 그대로 유지됩니다.
*/

-- 외래키 제약조건 먼저 제거
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_user_id_fkey;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_user_id_fkey;
ALTER TABLE gift_codes DROP CONSTRAINT IF EXISTS gift_codes_buyer_id_fkey;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_user_id_fkey;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_result_id_fkey;

-- users.id 타입 변경 (text → uuid)
ALTER TABLE users ALTER COLUMN id TYPE uuid USING id::uuid;

-- 자식 테이블 컬럼 타입 변경
ALTER TABLE results ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE purchases ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE gift_codes ALTER COLUMN buyer_id TYPE uuid USING buyer_id::uuid;
ALTER TABLE questions ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 외래키 다시 생성
ALTER TABLE results
  ADD CONSTRAINT results_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE purchases
  ADD CONSTRAINT purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE gift_codes
  ADD CONSTRAINT gift_codes_buyer_id_fkey
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE questions
  ADD CONSTRAINT questions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE questions
  ADD CONSTRAINT questions_result_id_fkey
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE;
