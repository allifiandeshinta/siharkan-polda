-- ============================================================
-- SIHARKAN-TIK: Perbaikan skema agar sesuai data asli
-- Migration 00009
--
-- Perubahan berdasarkan analisis file asli (.ai file):
--   1. inventaris: pisahkan merk & model, tambah serial_number
--      (data asli: merk = Motorola/Hytera/Tait, model = APX 1000/APX1000i/APX2500)
--   2. suku_cadang: ganti stok tunggal menjadi terima/digunakan/sisa
--      (data asli punya kolom TERIMA, DIGUNAKAN, SISA)
--   3. pinjaman: simpan serial_number + merk + model (data asli pakai no.seri)
--   4. tabel baru rekap_inventaris: snapshot agregat dari Excel REKAP DATA
--      (4.184 HT adalah rekap, bukan per-unit)
-- ============================================================

-- 1. INVENTARIS: model + serial_number
ALTER TABLE inventaris
  ADD COLUMN IF NOT EXISTS model VARCHAR(100) NOT NULL DEFAULT '';

ALTER TABLE inventaris
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);

-- 2. SUKU CADANG: terima / digunakan (stok tetap dipakai sebagai "sisa")
ALTER TABLE suku_cadang
  ADD COLUMN IF NOT EXISTS terima INTEGER NOT NULL DEFAULT 0 CHECK (terima >= 0);

ALTER TABLE suku_cadang
  ADD COLUMN IF NOT EXISTS digunakan INTEGER NOT NULL DEFAULT 0 CHECK (digunakan >= 0);

-- 3. PINJAMAN: serial_number + merk + model
--    (kolom jenis_ht tetap ada untuk kompatibilitas frontend)
--    id_ht dikembalikan sebagai FK opsional ke unit unik di inventaris
--    (0004 mengganti namanya jadi jenis_ht, 0007 menghapus FK-nya)
ALTER TABLE pinjaman
  ADD COLUMN IF NOT EXISTS id_ht VARCHAR(20) REFERENCES inventaris(id);

ALTER TABLE pinjaman
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);

ALTER TABLE pinjaman
  ADD COLUMN IF NOT EXISTS merk VARCHAR(100) NOT NULL DEFAULT '';

ALTER TABLE pinjaman
  ADD COLUMN IF NOT EXISTS model VARCHAR(100) NOT NULL DEFAULT '';

-- Unique key agar seed pinjaman idempoten (bisa dijalankan ulang)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'pinjaman'::regclass
      AND conname = 'uq_pinjaman_unit'
  ) THEN
    ALTER TABLE pinjaman
      ADD CONSTRAINT uq_pinjaman_unit
      UNIQUE (id_ht, serial_number, tgl_pinjam);
  END IF;
END $$;

-- 4. TABEL REKAP_INVENTARIS (snapshot agregat dari Excel REKAP DATA)
CREATE TABLE IF NOT EXISTS rekap_inventaris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  satwil VARCHAR(100) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  merk VARCHAR(50) NOT NULL DEFAULT '',
  kondisi VARCHAR(20) NOT NULL DEFAULT 'Baik',
  jumlah INTEGER NOT NULL DEFAULT 0 CHECK (jumlah >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rekap_satwil ON rekap_inventaris(satwil);
CREATE INDEX IF NOT EXISTS idx_rekap_kategori ON rekap_inventaris(kategori);

-- 5. ROW LEVEL SECURITY untuk rekap_inventaris
--    (konsisten dengan tabel lain: read = authenticated, write = service_role)
ALTER TABLE rekap_inventaris ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rekap_inventaris_select_authenticated ON rekap_inventaris;
CREATE POLICY rekap_inventaris_select_authenticated
  ON rekap_inventaris FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS rekap_inventaris_insert_service_role ON rekap_inventaris;
CREATE POLICY rekap_inventaris_insert_service_role
  ON rekap_inventaris FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS rekap_inventaris_update_service_role ON rekap_inventaris;
CREATE POLICY rekap_inventaris_update_service_role
  ON rekap_inventaris FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS rekap_inventaris_delete_service_role ON rekap_inventaris;
CREATE POLICY rekap_inventaris_delete_service_role
  ON rekap_inventaris FOR DELETE USING (auth.role() = 'service_role');
