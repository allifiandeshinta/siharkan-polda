-- SIHARKAN-TIK: RLS Policies and Storage Configuration
-- Migration 00002

-- ============================================================
-- 1. COMPLETE ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper: ensure RLS is enabled
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['satwil','kategori','inventaris','pinjaman','suku_cadang','tracking','sppm','admin_config'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Drop existing policies first (idempotent)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- satwil: authenticated can read, service_role can write
CREATE POLICY "satwil_select_authenticated" ON satwil FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "satwil_insert_service_role" ON satwil FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "satwil_update_service_role" ON satwil FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "satwil_delete_service_role" ON satwil FOR DELETE USING (auth.role() = 'service_role');

-- kategori: authenticated can read, service_role can write
CREATE POLICY "kategori_select_authenticated" ON kategori FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "kategori_insert_service_role" ON kategori FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "kategori_update_service_role" ON kategori FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "kategori_delete_service_role" ON kategori FOR DELETE USING (auth.role() = 'service_role');

-- inventaris: full CRUD for authenticated
CREATE POLICY "inventaris_select_authenticated" ON inventaris FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "inventaris_insert_authenticated" ON inventaris FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "inventaris_update_authenticated" ON inventaris FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "inventaris_delete_authenticated" ON inventaris FOR DELETE USING (auth.role() = 'authenticated');

-- pinjaman: full CRUD for authenticated
CREATE POLICY "pinjaman_select_authenticated" ON pinjaman FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "pinjaman_insert_authenticated" ON pinjaman FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pinjaman_update_authenticated" ON pinjaman FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "pinjaman_delete_authenticated" ON pinjaman FOR DELETE USING (auth.role() = 'authenticated');

-- suku_cadang: full CRUD for authenticated
CREATE POLICY "suku_cadang_select_authenticated" ON suku_cadang FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "suku_cadang_insert_authenticated" ON suku_cadang FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "suku_cadang_update_authenticated" ON suku_cadang FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "suku_cadang_delete_authenticated" ON suku_cadang FOR DELETE USING (auth.role() = 'authenticated');

-- tracking: full CRUD for authenticated
CREATE POLICY "tracking_select_authenticated" ON tracking FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tracking_insert_authenticated" ON tracking FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "tracking_update_authenticated" ON tracking FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "tracking_delete_authenticated" ON tracking FOR DELETE USING (auth.role() = 'authenticated');

-- sppm: full CRUD for authenticated
CREATE POLICY "sppm_select_authenticated" ON sppm FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sppm_insert_authenticated" ON sppm FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sppm_update_authenticated" ON sppm FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sppm_delete_authenticated" ON sppm FOR DELETE USING (auth.role() = 'authenticated');

-- admin_config: read/update for authenticated
CREATE POLICY "admin_config_select_authenticated" ON admin_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_config_update_authenticated" ON admin_config FOR UPDATE USING (auth.role() = 'authenticated');
-- Restrict insert/delete to service_role
CREATE POLICY "admin_config_insert_service_role" ON admin_config FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "admin_config_delete_service_role" ON admin_config FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================
-- 2. STORAGE BUCKET CONFIGURATION
-- ============================================================

-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'siharkan-tik',
  'siharkan-tik',
  true,
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

-- Storage RLS: authenticated users can CRUD
CREATE POLICY "storage_select_authenticated" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "storage_insert_authenticated" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "storage_update_authenticated" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "storage_delete_authenticated" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inventaris_kategori_id ON inventaris(kategori_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_lokasi_id ON inventaris(lokasi_id);
CREATE INDEX IF NOT EXISTS idx_pinjaman_satwil_id ON pinjaman(satwil_id);
CREATE INDEX IF NOT EXISTS idx_tracking_satwil_id ON tracking(satwil_id);

-- Full text search on inventaris using concatenated fields
CREATE INDEX IF NOT EXISTS idx_inventaris_search ON inventaris
  USING gin(to_tsvector('simple', coalesce(nama,'') || ' ' || coalesce(merk,'')));

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_inventaris_kategori_kondisi ON inventaris(kategori_id, kondisi);
CREATE INDEX IF NOT EXISTS idx_pinjaman_status_tgl ON pinjaman(status, tgl_kembali);
CREATE INDEX IF NOT EXISTS idx_tracking_status_tgl ON tracking(status, tgl DESC);
CREATE INDEX IF NOT EXISTS idx_sppm_sumber_tgl ON sppm(sumber, tgl DESC);
