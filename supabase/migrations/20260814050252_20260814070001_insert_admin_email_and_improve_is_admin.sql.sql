/*
# Insert admin email and improve is_admin() fallback

1. Data
- Insert hmj9455@kakao.com into admin_emails (bypasses RLS via migration).

2. Functions
- Update is_admin() to also check public.users.email as a fallback,
  since auth.users.email may be NULL depending on OAuth provider timing.
*/

INSERT INTO admin_emails (email)
SELECT 'hmj9455@kakao.com'
WHERE NOT EXISTS (SELECT 1 FROM admin_emails WHERE email = 'hmj9455@kakao.com');

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
      WHERE email = COALESCE(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM public.users WHERE id = auth.uid())
      )
    );
$$;
