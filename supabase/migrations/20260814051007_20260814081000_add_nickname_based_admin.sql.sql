/*
# Add nickname-based admin check as fallback

- Create admin_nicknames table for admin nickname registration.
- is_admin() now checks: admin_users (user_id) OR admin_nicknames (nickname).
- The nickname comes from kakao user_metadata, available without extra scope.
- Auto-promote trigger also checks admin_nicknames.
*/

CREATE TABLE IF NOT EXISTS admin_nicknames (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_nicknames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read admin_nicknames" ON admin_nicknames;
CREATE POLICY "anyone can read admin_nicknames" ON admin_nicknames FOR SELECT
  TO anon, authenticated USING (true);

-- is_admin: check admin_users (user_id) OR admin_nicknames (nickname from public.users)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM admin_nicknames an
      WHERE an.nickname = (
        SELECT nickname FROM public.users WHERE id = auth.uid()
      )
    );
$$;

-- Auto-promote: when a user is inserted into public.users, check if their
-- nickname matches any admin_nicknames entry. If so, add to admin_users.
CREATE OR REPLACE FUNCTION auto_promote_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_users (user_id)
  SELECT NEW.id
  WHERE EXISTS (
    SELECT 1 FROM admin_nicknames an WHERE an.nickname = NEW.nickname
  )
  AND NOT EXISTS (
    SELECT 1 FROM admin_users au WHERE au.user_id = NEW.id
  );
  RETURN NEW;
END;
$$;
