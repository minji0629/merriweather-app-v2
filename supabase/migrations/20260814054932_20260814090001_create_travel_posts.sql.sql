/*
# Create travel_posts table (여행자 광장)

1. New Tables
- `travel_posts`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `content` (text, not null)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with ON DELETE CASCADE)
  - `nickname` (text, not null - 작성자 닉네임 캐시)
  - `created_at` (timestamptz, default now())

2. Security (RLS)
- Enable RLS on `travel_posts`.
- SELECT: anyone (anon + authenticated) can read all posts (공개 게시판).
- INSERT: authenticated users can insert their own posts.
- DELETE: authenticated users can delete only their own posts.
- UPDATE: not used (글 수정 기능 없음).

3. Indexes
- `idx_travel_posts_created_at` on `created_at DESC` for list ordering.
*/

CREATE TABLE IF NOT EXISTS travel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE travel_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read all posts (공개 게시판)
DROP POLICY IF EXISTS "anyone_can_read_travel_posts" ON travel_posts;
CREATE POLICY "anyone_can_read_travel_posts" ON travel_posts FOR SELECT
  TO anon, authenticated USING (true);

-- Authenticated users can insert their own posts
DROP POLICY IF EXISTS "insert_own_travel_posts" ON travel_posts;
CREATE POLICY "insert_own_travel_posts" ON travel_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete only their own posts
DROP POLICY IF EXISTS "delete_own_travel_posts" ON travel_posts;
CREATE POLICY "delete_own_travel_posts" ON travel_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_travel_posts_created_at ON travel_posts(created_at DESC);
