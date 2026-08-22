/*
# Fix questions table: change default remaining_count from 3 to 1

## Changes
- Alters the `remaining_count` column default on the `questions` table from 3 to 1.
  - expedition (4,990원) = 1 question
  - expedition_plus (6,980원) = 4 questions (set explicitly in app)
  - extra_questions (1,990원) = +3 added to existing row

## Notes
- Existing rows are not affected (no UPDATE).
- This migration is idempotent: ALTER COLUMN is safe to re-run.
*/

ALTER TABLE questions ALTER COLUMN remaining_count SET DEFAULT 1;
