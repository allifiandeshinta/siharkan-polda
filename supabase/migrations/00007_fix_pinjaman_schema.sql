-- ============================================================
-- SIHARKAN-TIK: Fix pinjaman schema for Jenis HT + return tracking
-- Migration 00007
--
-- Context:
--   - 00004 renamed column id_ht -> jenis_ht (text) but did NOT drop
--     the foreign key to inventaris(id). New borrows store a Jenis
--     value (e.g. 'APX 1000'), which is NOT a valid inventaris id,
--     so INSERT/UPDATE fails with a foreign-key violation.
--   - The frontend (PinjamanHTPage) writes/reads is_returned and
--     tgl_dikembalikan to support the "Tandai Dikembalikan" action,
--     but those columns were never created.
--
-- This migration makes the schema match the implemented frontend.
-- ============================================================

-- 1. Drop the stale foreign key that points jenis_ht -> inventaris(id)
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

-- 2. Ensure jenis_ht is free text (already text after 00004, idempotent)
ALTER TABLE pinjaman ALTER COLUMN jenis_ht TYPE text;

-- 3. Add return-tracking columns used by the frontend
ALTER TABLE pinjaman
  ADD COLUMN IF NOT EXISTS is_returned BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE pinjaman
  ADD COLUMN IF NOT EXISTS tgl_dikembalikan TIMESTAMPTZ;

-- 4. Keep the status enum in sync with the dynamic client status.
--    The frontend computes status from is_returned + tgl_kembali,
--    but we still persist a value for filtering/back-compat.
--    No change to the enum itself is required.

-- 5. Index for faster "active borrow" queries
CREATE INDEX IF NOT EXISTS idx_pinjaman_returned ON pinjaman(is_returned);
