/*
# Add AI relation, AI growth, and product_type columns to results

1. Modified Tables
- `results`
  - `ai_relation` (TEXT, nullable) — "당신이 함께 걷는 법" 섹션의 AI 생성 텍스트 (관계 나침반)
  - `ai_growth` (TEXT, nullable) — "당신의 빛을 키우는 방법" 섹션의 AI 생성 텍스트 (성장 나침반)
  - `product_type` (TEXT, nullable) — 구매한 상품 유형 ('expedition' | 'expedition_plus').

2. Important Notes
- `ai_relation` and `ai_growth` are only populated for expedition_plus (탐험권 플러스) purchasers.
- `product_type` distinguishes expedition (4,990원) from expedition_plus (6,980원).
- All columns are nullable so existing rows are unaffected.
- No RLS policy changes needed — existing results policies already cover these columns.
*/

ALTER TABLE results ADD COLUMN IF NOT EXISTS ai_relation TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS ai_growth TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS product_type TEXT;
