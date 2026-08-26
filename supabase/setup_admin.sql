-- ============================================================
-- 민지님 Supabase (ngxnorloveputcddltmf)에서 직접 실행할 SQL
-- Supabase 대시보드 > SQL Editor 에 복사해서 붙여넣고 실행하세요.
-- ============================================================

-- 1. admin_users 테이블 (user_id 기반 관리자) - 테이블만 먼저 생성
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 2. admin_nicknames 테이블 (닉네임 기반 관리자 - 카카오 이메일 스코프 없이 사용 가능)
CREATE TABLE IF NOT EXISTS admin_nicknames (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_nicknames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read admin_nicknames" ON admin_nicknames;
CREATE POLICY "anyone can read admin_nicknames" ON admin_nicknames FOR SELECT
  TO anon, authenticated USING (true);

-- 3. is_admin() 함수 (user_id OR nickname 확인) - 두 테이블이 있어야 생성 가능
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

-- 4. admin_users 정책 (is_admin 함수가 생성된 후에 추가)
DROP POLICY IF EXISTS "authenticated_can_read_admins" ON admin_users;
CREATE POLICY "authenticated_can_read_admins" ON admin_users FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_can_insert_admin" ON admin_users;
CREATE POLICY "admin_can_insert_admin" ON admin_users FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_can_delete_admin" ON admin_users;
CREATE POLICY "admin_can_delete_admin" ON admin_users FOR DELETE
  TO authenticated USING (is_admin());

-- 5. 자동 승격 트리거 (닉네임이 admin_nicknames에 있으면 admin_users에 자동 등록)
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

DROP TRIGGER IF EXISTS on_user_insert_promote_admin ON public.users;
CREATE TRIGGER on_user_insert_promote_admin
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_admin();

-- 6. developer_notes 테이블
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

-- 7. developer_note_comments 테이블
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

CREATE INDEX IF NOT EXISTS idx_developer_note_comments_note_id ON developer_note_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_developer_notes_created_at ON developer_notes(created_at DESC);

-- 8. admin_emails 테이블 (참고용 - is_admin에서 더 이상 사용하지 않음)
CREATE TABLE IF NOT EXISTS admin_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can read admin_emails" ON admin_emails;
CREATE POLICY "anyone can read admin_emails" ON admin_emails FOR SELECT
  TO anon, authenticated USING (true);

-- 9. 민지님 카카오 닉네임을 admin_nicknames에 등록
--    아래 '민지' 부분을 실제 카카오 닉네임으로 변경해서 실행하세요.
--    예: INSERT INTO admin_nicknames (nickname) VALUES ('민지닉네임');
INSERT INTO admin_nicknames (nickname)
SELECT '민지'
WHERE NOT EXISTS (SELECT 1 FROM admin_nicknames WHERE nickname = '민지');
