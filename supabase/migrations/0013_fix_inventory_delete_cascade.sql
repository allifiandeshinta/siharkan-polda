-- ============================================================
-- SIHARKAN-TIK: Fix Foreign Key Constraints, RLS, and RPC for Inventory Deletion
-- Migration 0013
-- ============================================================

-- 1. Fix Foreign Key Constraints on inventaris_mutasi
ALTER TABLE inventaris_mutasi
  DROP CONSTRAINT IF EXISTS inventaris_mutasi_batch_id_fkey;

ALTER TABLE inventaris_mutasi
  ADD CONSTRAINT inventaris_mutasi_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES inventaris_batch(id) ON DELETE CASCADE;

ALTER TABLE inventaris_mutasi
  DROP CONSTRAINT IF EXISTS inventaris_mutasi_inventaris_id_fkey;

ALTER TABLE inventaris_mutasi
  ADD CONSTRAINT inventaris_mutasi_inventaris_id_fkey
  FOREIGN KEY (inventaris_id) REFERENCES inventaris(id) ON DELETE CASCADE;

-- 2. Ensure pinjaman has columns and proper foreign keys
ALTER TABLE pinjaman
  ADD COLUMN IF NOT EXISTS id_ht VARCHAR(20),
  ADD COLUMN IF NOT EXISTS batch_id UUID;

ALTER TABLE pinjaman
  DROP CONSTRAINT IF EXISTS pinjaman_batch_id_fkey;

ALTER TABLE pinjaman
  ADD CONSTRAINT pinjaman_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES inventaris_batch(id) ON DELETE SET NULL;

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'pinjaman'::regclass
    AND confrelid = 'inventaris'::regclass
    AND contype = 'f';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE pinjaman DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE pinjaman
  ADD CONSTRAINT pinjaman_id_ht_fkey
  FOREIGN KEY (id_ht) REFERENCES inventaris(id) ON DELETE SET NULL;

-- 3. Fix RLS policies on inventaris_mutasi to allow DELETE & UPDATE
DROP POLICY IF EXISTS inventaris_mutasi_read ON inventaris_mutasi;
CREATE POLICY inventaris_mutasi_read ON inventaris_mutasi FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS inventaris_mutasi_write ON inventaris_mutasi;
DROP POLICY IF EXISTS inventaris_mutasi_all ON inventaris_mutasi;
CREATE POLICY inventaris_mutasi_all ON inventaris_mutasi FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Atomic RPC Function to Delete Batch Inventaris
CREATE OR REPLACE FUNCTION delete_inventaris_batch(p_batch_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unreturned INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna harus terautentikasi';
  END IF;

  -- Check if active unreturned loans exist
  SELECT COUNT(*) INTO v_unreturned
  FROM pinjaman
  WHERE batch_id = p_batch_id
    AND is_returned = false
    AND (jumlah - COALESCE(jumlah_dikembalikan, 0)) > 0;

  IF v_unreturned > 0 THEN
    RAISE EXCEPTION 'Batch tidak dapat dihapus karena masih ada unit yang sedang dipinjam';
  END IF;

  -- Unlink returned pinjaman so historical data is preserved
  UPDATE pinjaman SET batch_id = NULL WHERE batch_id = p_batch_id;

  -- Delete mutasi records
  DELETE FROM inventaris_mutasi WHERE batch_id = p_batch_id;

  -- Delete batch record
  DELETE FROM inventaris_batch WHERE id = p_batch_id;

  RETURN json_build_object('success', true, 'batch_id', p_batch_id);
END; $$;

REVOKE ALL ON FUNCTION delete_inventaris_batch(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_inventaris_batch(UUID) TO authenticated;

-- 5. Atomic RPC Function to Delete Unit Inventaris
CREATE OR REPLACE FUNCTION delete_inventaris_unit(p_inventaris_id VARCHAR)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unreturned INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Pengguna harus terautentikasi';
  END IF;

  -- Check if unit is currently borrowed
  SELECT COUNT(*) INTO v_unreturned
  FROM pinjaman
  WHERE id_ht = p_inventaris_id AND is_returned = false;

  IF v_unreturned > 0 THEN
    RAISE EXCEPTION 'Unit tidak dapat dihapus karena masih tercatat sedang dipinjam';
  END IF;

  -- Unlink returned pinjaman
  UPDATE pinjaman SET id_ht = NULL WHERE id_ht = p_inventaris_id;

  -- Delete mutasi records
  DELETE FROM inventaris_mutasi WHERE inventaris_id = p_inventaris_id;

  -- Delete unit
  DELETE FROM inventaris WHERE id = p_inventaris_id;

  RETURN json_build_object('success', true, 'id', p_inventaris_id);
END; $$;

REVOKE ALL ON FUNCTION delete_inventaris_unit(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_inventaris_unit(VARCHAR) TO authenticated;
