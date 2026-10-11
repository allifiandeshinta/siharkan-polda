-- HOTFIX: Allow anon access for all tables
-- The app uses custom login (not Supabase Auth), so auth.role() is always 'anon'
-- RLS policies requiring 'authenticated' block all queries silently

-- Drop all existing policies first
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Recreate with permissive policies (allow all for simplicity, single-admin app)

-- satwil
CREATE POLICY "satwil_all" ON satwil FOR ALL USING (true);
-- kategori
CREATE POLICY "kategori_all" ON kategori FOR ALL USING (true);
-- inventaris
CREATE POLICY "inventaris_all" ON inventaris FOR ALL USING (true);
-- pinjaman
CREATE POLICY "pinjaman_all" ON pinjaman FOR ALL USING (true);
-- suku_cadang
CREATE POLICY "suku_cadang_all" ON suku_cadang FOR ALL USING (true);
-- tracking
CREATE POLICY "tracking_all" ON tracking FOR ALL USING (true);
-- sppm
CREATE POLICY "sppm_all" ON sppm FOR ALL USING (true);
-- admin_config
CREATE POLICY "admin_config_all" ON admin_config FOR ALL USING (true);

-- Storage: allow all
DROP POLICY IF EXISTS "storage_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_authenticated" ON storage.objects;

CREATE POLICY "storage_all_select" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "storage_all_insert" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "storage_all_update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "storage_all_delete" ON storage.objects FOR DELETE USING (true);
