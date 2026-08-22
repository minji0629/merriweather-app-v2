/*
# Recreate admin_emails table with id column and open read policy

1. Changes
- Drop existing admin_emails table (empty, no data loss) and its policies.
- Recreate with id uuid PRIMARY KEY, email text UNIQUE NOT NULL, created_at.
- Enable RLS.
- Add "anyone can read" SELECT policy (anon + authenticated).
- is_admin() function still works since it queries by email (still UNIQUE).
*/

DROP POLICY IF EXISTS "admin_can_delete_admin_email" ON admin_emails;
DROP POLICY IF EXISTS "admin_can_insert_admin_email" ON admin_emails;
DROP POLICY IF EXISTS "authenticated_can_read_admin_emails" ON admin_emails;

DROP TABLE IF EXISTS admin_emails;

CREATE TABLE admin_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read" ON admin_emails FOR SELECT
  TO anon, authenticated USING (true);
