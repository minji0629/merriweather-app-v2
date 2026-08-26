/*
# Create developer notes feature

1. New Tables
- `admin_users`: stores admin user_ids (references auth.users).
- `developer_notes`: developer note posts (id, title, content, created_at).
- `developer_note_comments`: comments on notes (id, note_id FK, user_id, content, created_at).

2. Functions
- `is_admin()`: returns true if auth.uid() exists in admin_users. SECURITY DEFINER.

3. Security (RLS)
- admin_users: SELECT for authenticated; INSERT/DELETE only for existing admins.
- developer_notes: SELECT for everyone; INSERT/UPDATE/DELETE only for admins.
- developer_note_comments: SELECT for everyone; INSERT for authenticated (own);
  DELETE for own or admin.
*/

-- Admin users table (must exist before is_admin function)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- is_admin function (SECURITY DEFINER to bypass RLS on admin_users)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

-- Now enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_read_admins" ON admin_users;
CREATE POLICY "authenticated_can_read_admins" ON admin_users FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_can_insert_admin" ON admin_users;
CREATE POLICY "admin_can_insert_admin" ON admin_users FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_can_delete_admin" ON admin_users;
CREATE POLICY "admin_can_delete_admin" ON admin_users FOR DELETE
  TO authenticated USING (is_admin());

-- Developer notes table
CREATE TABLE IF NOT EXISTS developer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE developer_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "everyone_can_read_notes" ON developer_notes;
CREATE POLICY "everyone_can_read_notes" ON developer_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_can_insert_notes" ON developer_notes;
CREATE POLICY "admin_can_insert_notes" ON developer_notes FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_can_update_notes" ON developer_notes;
CREATE POLICY "admin_can_update_notes" ON developer_notes FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_can_delete_notes" ON developer_notes;
CREATE POLICY "admin_can_delete_notes" ON developer_notes FOR DELETE
  TO authenticated USING (is_admin());

-- Developer note comments table
CREATE TABLE IF NOT EXISTS developer_note_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES developer_notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE developer_note_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "everyone_can_read_comments" ON developer_note_comments;
CREATE POLICY "everyone_can_read_comments" ON developer_note_comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_can_insert_comments" ON developer_note_comments;
CREATE POLICY "authenticated_can_insert_comments" ON developer_note_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_can_delete_own_comments" ON developer_note_comments;
CREATE POLICY "authenticated_can_delete_own_comments" ON developer_note_comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_developer_note_comments_note_id ON developer_note_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_developer_notes_created_at ON developer_notes(created_at DESC);
