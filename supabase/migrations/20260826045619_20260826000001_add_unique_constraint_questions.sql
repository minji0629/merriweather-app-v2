-- Add unique constraint on questions (user_id, result_id) to prevent duplicate rows
-- This ensures upsertQuestions can safely use maybeSingle() without ambiguity

-- First remove any existing duplicates (keep the newest by created_at)
DELETE FROM questions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, result_id) id
  FROM questions
  ORDER BY user_id, result_id, created_at DESC
);

-- Add the unique constraint
ALTER TABLE questions
  ADD CONSTRAINT questions_user_id_result_id_unique UNIQUE (user_id, result_id);
