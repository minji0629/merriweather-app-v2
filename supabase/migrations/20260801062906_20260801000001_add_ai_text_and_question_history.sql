/*
# Add AI text columns to results and question_history to questions

1. Modified Tables
   - `results`
     - `ai_result` (TEXT, nullable) — "당신 안에 흐르는 결" AI 생성 텍스트 저장
     - `ai_letter` (TEXT, nullable) — "루의 편지" AI 생성 텍스트 저장
   - `questions`
     - `question_history` (JSONB, default '[]') — 질문/답변 내역을 배열로 저장

2. Purpose
   - 보관함에서 유료 결과를 다시 볼 때 AI 텍스트를 새로 생성하지 않고
     저장된 값을 그대로 표시하기 위해 컬럼을 추가.
   - 루에게 질문한 내역(question/answer)을 저장하고
     보관함에서 다시 볼 때 그대로 표시.

3. Security
   - 기존 RLS 정책 유지. 컬럼 추가만 하므로 정책 변경 없음.
*/

ALTER TABLE results
  ADD COLUMN IF NOT EXISTS ai_result TEXT,
  ADD COLUMN IF NOT EXISTS ai_letter TEXT;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_history JSONB DEFAULT '[]'::jsonb;
