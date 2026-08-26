/*
# Simplify is_admin() to user_id-only check

- Remove email-based admin check (kakao doesn't provide email without extra scope).
- is_admin() now only checks admin_users table by auth.uid().
- admin_emails table is kept but no longer used by is_admin().
- Add a trigger: when a new user is created in public.users, if admin_emails
  contains the user's email (from auth.users metadata), auto-insert into admin_users.
  This allows pre-registering admin by email, and the trigger activates admin
  when the user first logs in (even without account_email scope, since Supabase
  stores the kakao email in auth.users.email during OAuth).
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

-- Auto-promote: when a row is inserted into public.users, check if the
-- corresponding auth.users email matches any admin_emails entry.
-- If so, insert the user_id into admin_users (idempotent).
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
    SELECT 1 FROM admin_emails ae
    WHERE ae.email = (
      SELECT email FROM auth.users WHERE id = NEW.id
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM admin_users au WHERE au.user_id = NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_insert_promote_admin ON public.users;
CREATE TRIGGER on_user_insert_promote_admin
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_admin();
