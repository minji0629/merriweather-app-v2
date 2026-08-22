/*
# Add email-based admin registration

1. New Tables
- `admin_emails`: stores admin email addresses. When a user logs in with a matching
  email, is_admin() returns true automatically. This solves the chicken-and-egg
  problem — the first admin is registered by email before they ever log in.

2. Functions
- `is_admin()`: updated to check both admin_users (by user_id) AND admin_emails
  (by email). A user is admin if their user_id is in admin_users OR their email
  is in admin_emails.

3. Security
- admin_emails: SELECT for authenticated; INSERT/DELETE only for existing admins.
*/

CREATE TABLE IF NOT EXISTS admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_read_admin_emails" ON admin_emails;
CREATE POLICY "authenticated_can_read_admin_emails" ON admin_emails FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_can_insert_admin_email" ON admin_emails;
CREATE POLICY "admin_can_insert_admin_email" ON admin_emails FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_can_delete_admin_email" ON admin_emails;
CREATE POLICY "admin_can_delete_admin_email" ON admin_emails FOR DELETE
  TO authenticated USING (is_admin());

-- Update is_admin() to also check admin_emails by matching the user's email
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
      SELECT 1 FROM admin_emails
      WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    );
$$;
