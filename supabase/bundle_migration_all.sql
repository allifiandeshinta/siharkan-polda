-- ============================================================
-- SIHARKAN TIK: MASTER BUNDLED MIGRATION SCRIPT
-- Eksekusi skrip ini di Supabase SQL Editor (1x RUN)
-- ============================================================



-- >>> START 00001_initial_schema_fixed.sql <<<
-- SIHARKAN-TIK: Initial Database Schema
-- Migration 00001

-- 1. ENUM TYPES
CREATE TYPE kondisi_alat AS ENUM ('Baik', 'Rusak Ringan', 'Rusak Berat');
CREATE TYPE status_pinjaman AS ENUM ('Dipinjam', 'Dikembalikan', 'Terlambat');
CREATE TYPE status_tracking AS ENUM ('Belum Ditindaklanjuti', 'Proses', 'Selesai');

-- 2. REFERENCE TABLES

CREATE TABLE satwil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kategori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed reference data
INSERT INTO satwil (nama) VALUES
  ('Mapolda DIY'),
  ('Polresta Yogyakarta'),
  ('Polres Sleman'),
  ('Polres Bantul'),
  ('Polres Kulon Progo'),
  ('Polres Gunungkidul');

INSERT INTO kategori (nama) VALUES
  ('HT'),
  ('Tower'),
  ('Repeater'),
  ('Ransus'),
  ('Bodyworn'),
  ('Command Center'),
  ('Call Center'),
  ('Drone');

-- 3. MAIN TABLES

CREATE TABLE inventaris (
  id VARCHAR(20) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  merk VARCHAR(100) NOT NULL DEFAULT '',
  kategori_id UUID NOT NULL REFERENCES kategori(id),
  kondisi kondisi_alat NOT NULL DEFAULT 'Baik',
  lokasi_id UUID NOT NULL REFERENCES satwil(id),
  tgl DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pinjaman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ht VARCHAR(20) NOT NULL REFERENCES inventaris(id),
  satwil_id UUID NOT NULL REFERENCES satwil(id),
  tgl_pinjam DATE NOT NULL DEFAULT CURRENT_DATE,
  tgl_kembali DATE NOT NULL,
  keterangan TEXT NOT NULL DEFAULT '',
  status status_pinjaman NOT NULL DEFAULT 'Dipinjam',
  file_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE suku_cadang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  satuan VARCHAR(10) NOT NULL DEFAULT 'pcs',
  stok INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
  min_stok INTEGER NOT NULL DEFAULT 0,
  transaksi_bln INTEGER NOT NULL DEFAULT 0 CHECK (transaksi_bln >= 0),
  kategori_sc VARCHAR(50) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tracking (
  id VARCHAR(20) PRIMARY KEY,
  satwil_id UUID NOT NULL REFERENCES satwil(id),
  jenis VARCHAR(100) NOT NULL,
  tgl DATE NOT NULL DEFAULT CURRENT_DATE,
  status status_tracking NOT NULL DEFAULT 'Belum Ditindaklanjuti',
  file_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sppm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor VARCHAR(100) NOT NULL UNIQUE,
  sumber VARCHAR(20) NOT NULL DEFAULT 'Mabes Polri' CHECK (sumber IN ('Mabes Polri', 'Polres')),
  perihal VARCHAR(255) NOT NULL DEFAULT '',
  tgl DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL DEFAULT 'Admin Bid TIK',
  jabatan VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(100) NOT NULL DEFAULT 'Administrator',
  telepon VARCHAR(50) NOT NULL DEFAULT '',
  jam_operasional VARCHAR(100) NOT NULL DEFAULT 'Senin–Jumat, 08.00–16.00 WIB',
  email VARCHAR(100) NOT NULL DEFAULT '',
  email_note VARCHAR(100) NOT NULL DEFAULT 'Respon dalam 1 hari kerja',
  alamat TEXT NOT NULL DEFAULT '',
  alamat_detail TEXT NOT NULL DEFAULT '',
  avatar_mode VARCHAR(20) NOT NULL DEFAULT 'logo',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed admin config
INSERT INTO admin_config (nama, jabatan, role, telepon, jam_operasional, email, email_note, alamat, alamat_detail, avatar_mode)
VALUES (
  'Admin Bid TIK',
  'Bidang Teknologi Informasi dan Komunikasi, Polda DIY',
  'Administrator',
  '(0274) 555-0123',
  'Senin–Jumat, 08.00–16.00 WIB',
  'admin.harkan@poldadiy.go.id',
  'Respon dalam 1 hari kerja',
  'Mako Polda DIY, Jl. Ring Road Utara, Sleman, Yogyakarta',
  'Gedung Bid TIK, Lantai 2',
  'logo'
);

-- 4. INDEXES

CREATE INDEX idx_inventaris_kategori ON inventaris(kategori_id);
CREATE INDEX idx_inventaris_kondisi ON inventaris(kondisi);
CREATE INDEX idx_inventaris_lokasi ON inventaris(lokasi_id);
CREATE INDEX idx_inventaris_search
ON inventaris
USING gin (
    to_tsvector(
        'simple',
        COALESCE(nama, '') || ' ' ||
        COALESCE(merk, '')
    )
);

CREATE INDEX idx_pinjaman_status ON pinjaman(status);
CREATE INDEX idx_pinjaman_id_ht ON pinjaman(id_ht);
CREATE INDEX idx_pinjaman_satwil ON pinjaman(satwil_id);

CREATE INDEX idx_suku_cadang_kategori ON suku_cadang(kategori_sc);
CREATE INDEX idx_suku_cadang_stok ON suku_cadang(stok) WHERE stok < min_stok;

CREATE INDEX idx_tracking_status ON tracking(status);
CREATE INDEX idx_tracking_satwil ON tracking(satwil_id);
CREATE INDEX idx_tracking_tgl ON tracking(tgl DESC);

CREATE INDEX idx_sppm_sumber ON sppm(sumber);
CREATE INDEX idx_sppm_tgl ON sppm(tgl DESC);

-- 5. AUTO-UPDATE updated_at TRIGGER

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventaris_updated_at BEFORE UPDATE ON inventaris
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pinjaman_updated_at BEFORE UPDATE ON pinjaman
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suku_cadang_updated_at BEFORE UPDATE ON suku_cadang
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tracking_updated_at BEFORE UPDATE ON tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sppm_updated_at BEFORE UPDATE ON sppm
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_admin_config_updated_at BEFORE UPDATE ON admin_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. ROW LEVEL SECURITY

ALTER TABLE satwil ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE suku_cadang ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sppm ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON satwil FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON kategori FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON inventaris FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON pinjaman FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON suku_cadang FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON tracking FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON sppm FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON admin_config FOR ALL USING (auth.role() = 'authenticated');

-- 7. SEED INVENTARIS DATA

INSERT INTO inventaris (id, nama, merk, kategori_id, kondisi, lokasi_id, tgl) VALUES
  ('HT-001', 'HT Motorola CP1660', 'Motorola', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2024-01-12'),
  ('HT-002', 'HT Hytera PD365', 'Hytera', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2024-03-20'),
  ('HT-003', 'HT Icom IC-2730', 'Icom', (SELECT id FROM kategori WHERE nama='HT'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Polres Sleman'), '2023-06-05'),
  ('HT-004', 'HT Motorola GP338', 'Motorola', (SELECT id FROM kategori WHERE nama='HT'), 'Rusak Berat', (SELECT id FROM satwil WHERE nama='Polres Bantul'), '2022-02-11'),
  ('HT-005', 'HT Kenwood TK-3000', 'Kenwood', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Kulon Progo'), '2024-05-01'),
  ('HT-006', 'HT Motorola GP328', 'Motorola', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), '2023-11-15'),
  ('HT-007', 'HT Hytera BD502i', 'Hytera', (SELECT id FROM kategori WHERE nama='HT'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2022-08-30'),
  ('HT-008', 'HT Icom IC-V80', 'Icom', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Sleman'), '2024-02-14'),
  ('HT-009', 'HT Motorola CP1660', 'Motorola', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2023-07-22'),
  ('HT-010', 'HT Kenwood TK-2312', 'Kenwood', (SELECT id FROM kategori WHERE nama='HT'), 'Rusak Berat', (SELECT id FROM satwil WHERE nama='Polres Bantul'), '2021-12-01'),
  ('HT-011', 'HT Motorola CP1660', 'Motorola', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2024-01-20'),
  ('HT-012', 'HT Hytera PD365', 'Hytera', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), '2023-09-10'),
  ('HT-013', 'HT Icom IC-F27SR', 'Icom', (SELECT id FROM kategori WHERE nama='HT'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Polres Kulon Progo'), '2022-04-18'),
  ('HT-014', 'HT Motorola GP338', 'Motorola', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2023-03-05'),
  ('HT-015', 'HT Kenwood TK-3000', 'Kenwood', (SELECT id FROM kategori WHERE nama='HT'), 'Rusak Berat', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2021-10-11'),
  ('TWR-001', 'Tower BTS 42 Meter', 'Stabiline', (SELECT id FROM kategori WHERE nama='Tower'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2020-05-10'),
  ('TWR-002', 'Tower Triangle 30 Meter', 'Perkasa', (SELECT id FROM kategori WHERE nama='Tower'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Sleman'), '2019-08-22'),
  ('TWR-003', 'Tower Monopole 25 Meter', 'Galvanindo', (SELECT id FROM kategori WHERE nama='Tower'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Polres Bantul'), '2018-03-14'),
  ('TWR-004', 'Tower Rooftop 15 Meter', 'Stabiline', (SELECT id FROM kategori WHERE nama='Tower'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), '2021-11-07'),
  ('RPT-001', 'Repeater Motorola CDM1550', 'Motorola', (SELECT id FROM kategori WHERE nama='Repeater'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), '2022-09-03'),
  ('RPT-002', 'Repeater Hytera RD985', 'Hytera', (SELECT id FROM kategori WHERE nama='Repeater'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2023-04-18'),
  ('RPT-003', 'Repeater Kenwood NX-D800', 'Kenwood', (SELECT id FROM kategori WHERE nama='Repeater'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Sleman'), '2023-01-09'),
  ('RPT-004', 'Repeater Icom IC-FR5100', 'Icom', (SELECT id FROM kategori WHERE nama='Repeater'), 'Rusak Berat', (SELECT id FROM satwil WHERE nama='Polres Kulon Progo'), '2020-06-25'),
  ('RPT-005', 'Repeater Motorola SLR8000', 'Motorola', (SELECT id FROM kategori WHERE nama='Repeater'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Bantul'), '2024-02-11'),
  ('RNS-001', 'Kendaraan Ransus Komunikasi', 'Toyota', (SELECT id FROM kategori WHERE nama='Ransus'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2021-07-17'),
  ('RNS-002', 'Motor Ransus TIK', 'Honda', (SELECT id FROM kategori WHERE nama='Ransus'), 'Baik', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2022-03-05'),
  ('RNS-003', 'Kendaraan Ransus VSAT', 'Mitsubishi', (SELECT id FROM kategori WHERE nama='Ransus'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2019-11-20'),
  ('BWC-001', 'Bodyworn Camera Axon Body 3', 'Axon', (SELECT id FROM kategori WHERE nama='Bodyworn'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2024-01-05'),
  ('BWC-002', 'Bodyworn Camera Hytera VM685', 'Hytera', (SELECT id FROM kategori WHERE nama='Bodyworn'), 'Baik', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2023-12-10'),
  ('BWC-003', 'Bodyworn Camera Motorola VB400', 'Motorola', (SELECT id FROM kategori WHERE nama='Bodyworn'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Polres Sleman'), '2023-08-22'),
  ('BWC-004', 'Bodyworn Camera Axon Body 3', 'Axon', (SELECT id FROM kategori WHERE nama='Bodyworn'), 'Baik', (SELECT id FROM satwil WHERE nama='Polres Bantul'), '2024-01-05'),
  ('CMD-001', 'Server Command Center Dell PowerEdge', 'Dell', (SELECT id FROM kategori WHERE nama='Command Center'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2023-01-08'),
  ('CMD-002', 'Layar Videwall 55 Inch', 'Samsung', (SELECT id FROM kategori WHERE nama='Command Center'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2022-06-14'),
  ('CMD-003', 'Workstation Command Center HP Z440', 'HP', (SELECT id FROM kategori WHERE nama='Command Center'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2021-09-30'),
  ('CCT-001', 'PABX NEC SV9100', 'NEC', (SELECT id FROM kategori WHERE nama='Call Center'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2022-08-15'),
  ('CCT-002', 'IP Phone Cisco 7942G', 'Cisco', (SELECT id FROM kategori WHERE nama='Call Center'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2022-08-15'),
  ('CCT-003', 'IP Phone Cisco 7942G', 'Cisco', (SELECT id FROM kategori WHERE nama='Call Center'), 'Rusak Berat', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2021-05-20'),
  ('DRN-001', 'Drone DJI Mavic 3 Enterprise', 'DJI', (SELECT id FROM kategori WHERE nama='Drone'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2024-03-01'),
  ('DRN-002', 'Drone DJI Matrice 300 RTK', 'DJI', (SELECT id FROM kategori WHERE nama='Drone'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2023-07-10'),
  ('DRN-003', 'Drone Autel Evo II Pro', 'Autel', (SELECT id FROM kategori WHERE nama='Drone'), 'Rusak Ringan', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2022-11-18');

-- Seed pinjaman data
INSERT INTO pinjaman (id_ht, satwil_id, tgl_pinjam, tgl_kembali, status) VALUES
  ('HT-014', (SELECT id FROM satwil WHERE nama='Polres Sleman'), '2026-06-10', '2026-06-25', 'Dipinjam'),
  ('HT-006', (SELECT id FROM satwil WHERE nama='Polres Bantul'), '2026-06-01', '2026-06-20', 'Terlambat'),
  ('HT-009', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2026-05-15', '2026-05-30', 'Dikembalikan'),
  ('HT-011', (SELECT id FROM satwil WHERE nama='Polres Kulon Progo'), '2026-06-15', '2026-06-26', 'Dipinjam'),
  ('HT-012', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), '2026-06-18', '2026-06-24', 'Dipinjam'),
  ('HT-001', (SELECT id FROM satwil WHERE nama='Polres Sleman'), '2026-04-10', '2026-04-25', 'Dikembalikan'),
  ('HT-002', (SELECT id FROM satwil WHERE nama='Polres Bantul'), '2026-03-05', '2026-03-20', 'Dikembalikan'),
  ('HT-005', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2026-02-14', '2026-03-01', 'Dikembalikan'),
  ('HT-008', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), '2026-01-20', '2026-02-05', 'Dikembalikan'),
  ('HT-013', (SELECT id FROM satwil WHERE nama='Polres Kulon Progo'), '2026-06-20', '2026-06-25', 'Dipinjam');

-- Seed suku_cadang data
INSERT INTO suku_cadang (nama, satuan, stok, min_stok, transaksi_bln, kategori_sc) VALUES
  ('Baterai HT Motorola GP328', 'pcs', 3, 10, 4, 'Baterai'),
  ('Baterai HT Hytera PD365', 'pcs', 5, 8, 3, 'Baterai'),
  ('Baterai HT Kenwood TK-3000', 'pcs', 2, 5, 2, 'Baterai'),
  ('Antena HT Kenwood TK-3000', 'pcs', 4, 6, 2, 'Antena'),
  ('Antena HT Universal VHF', 'pcs', 7, 5, 1, 'Antena'),
  ('Kabel Programming Motorola', 'pcs', 6, 4, 1, 'Kabel'),
  ('Kabel LAN Cat6 5 Meter', 'pcs', 20, 10, 5, 'Kabel'),
  ('Kabel Fiber Optik SC-SC', 'm', 100, 50, 0, 'Kabel'),
  ('Charger HT Hytera', 'pcs', 12, 5, 2, 'Charger'),
  ('Headset HT Universal', 'pcs', 8, 5, 1, 'Aksesori'),
  ('Power Supply Repeater 12V', 'pcs', 3, 4, 1, 'Power Supply'),
  ('Lightning Arrestor N-Male', 'pcs', 5, 4, 0, 'Aksesori'),
  ('Konektor Antena N-Female', 'pcs', 4, 8, 3, 'Aksesori'),
  ('Modul SFP Gigabit LC', 'pcs', 6, 4, 1, 'Jaringan'),
  ('Baterai UPS 12V 9Ah', 'pcs', 5, 4, 2, 'Baterai'),
  ('RAM Server 8GB DDR4', 'pcs', 4, 2, 0, 'Komponen Server');

-- Seed tracking data
INSERT INTO tracking (id, satwil_id, jenis, tgl, status) VALUES
  ('ADU-001', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), 'Jaringan Internet', '2026-06-21', 'Belum Ditindaklanjuti'),
  ('ADU-002', (SELECT id FROM satwil WHERE nama='Polres Bantul'), 'Perbaikan HT', '2026-06-20', 'Belum Ditindaklanjuti'),
  ('ADU-003', (SELECT id FROM satwil WHERE nama='Polres Sleman'), 'Server Down', '2026-06-19', 'Proses'),
  ('ADU-004', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), 'Perbaikan HT', '2026-06-18', 'Proses'),
  ('ADU-005', (SELECT id FROM satwil WHERE nama='Polres Kulon Progo'), 'CCTV Offline', '2026-06-17', 'Proses'),
  ('ADU-006', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), 'Penggantian Baterai', '2026-06-16', 'Proses'),
  ('ADU-007', (SELECT id FROM satwil WHERE nama='Polres Sleman'), 'Perbaikan HT', '2026-06-14', 'Selesai'),
  ('ADU-008', (SELECT id FROM satwil WHERE nama='Polres Bantul'), 'Jaringan Internet', '2026-06-12', 'Selesai'),
  ('ADU-009', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), 'Repeater Mati', '2026-06-10', 'Selesai'),
  ('ADU-010', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), 'Perbaikan HT', '2026-06-08', 'Selesai'),
  ('ADU-011', (SELECT id FROM satwil WHERE nama='Polres Kulon Progo'), 'Server Lambat', '2026-06-05', 'Selesai'),
  ('ADU-012', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), 'Perbaikan HT', '2026-06-03', 'Selesai'),
  ('ADU-013', (SELECT id FROM satwil WHERE nama='Polres Sleman'), 'Jaringan Internet', '2026-05-28', 'Selesai'),
  ('ADU-014', (SELECT id FROM satwil WHERE nama='Polres Bantul'), 'Perbaikan HT', '2026-05-20', 'Selesai'),
  ('ADU-015', (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'), 'Antena Rusak', '2026-05-15', 'Selesai'),
  ('ADU-016', (SELECT id FROM satwil WHERE nama='Polres Gunungkidul'), 'CCTV Offline', '2026-06-22', 'Belum Ditindaklanjuti'),
  ('ADU-017', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), 'Router Mati', '2026-06-21', 'Belum Ditindaklanjuti');

-- Seed sppm data
INSERT INTO sppm (nomor, sumber, perihal, tgl, file_url) VALUES
  ('001/SPPM/MABES/I/2026', 'Mabes Polri', 'Pemeliharaan HT Polres Sleman', '2026-01-15', ''),
  ('002/SPPM/MABES/II/2026', 'Mabes Polri', 'Kalibrasi Repeater Polda DIY', '2026-02-20', ''),
  ('003/SPPM/POLRES/III/2026', 'Polres', 'Perbaikan Jaringan Polres Bantul', '2026-03-10', ''),
  ('004/SPPM/MABES/IV/2026', 'Mabes Polri', 'Pengadaan Antena Baru', '2026-04-05', ''),
  ('005/SPPM/POLRES/V/2026', 'Polres', 'Perbaikan Tower Polres Gunungkidul', '2026-05-12', ''),
  ('006/SPPM/MABES/VI/2026', 'Mabes Polri', 'Pengecekan Command Center', '2026-06-01', ''),
  ('007/SPPM/POLRES/VII/2026', 'Polres', 'Penggantian Baterai UPS', '2026-07-08', '');

-- >>> END 00001_initial_schema_fixed.sql <<<


-- >>> START 00002_rls_and_storage.sql <<<
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

-- >>> END 00002_rls_and_storage.sql <<<


-- >>> START 00003_hotfix_rls_anon.sql <<<
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

-- >>> END 00003_hotfix_rls_anon.sql <<<


-- >>> START 00004_rename_ht_to_jenis_ht.sql <<<
-- Rename the `id_ht` column to `jenis_ht` in the `pinjaman` table
-- The existing data in `id_ht` (which likely contained IDs like 'HT-001') will be moved.
-- Since the revision asks to replace ID with Jenis (Type), we might want to keep it as string.

ALTER TABLE pinjaman
RENAME COLUMN id_ht TO jenis_ht;

-- Ensure column is text type (Supabase/PostgreSQL usually uses text or uuid for IDs)
ALTER TABLE pinjaman
ALTER COLUMN jenis_ht TYPE text;

-- If the existing data was unique IDs and now we want types, the user should update the data.
-- But for now, the structure is updated.

-- Also update RLS if needed (usually not needed for renaming columns, but good to check)
-- Assuming public access for now as per existing migrations.

-- >>> END 00004_rename_ht_to_jenis_ht.sql <<<


-- >>> START 00005_create_profiles.sql <<<
-- Create the `profiles` table referenced by src/services/auth.js -> getUserRole()
-- The app queries profiles(user_id, role) to resolve a user's role.
-- Without this table, Supabase returns 404 and role resolution fails.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'User',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (matches the app's anon-access pattern from 00003)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permissive policy: the app uses custom login, so auth.role() is 'anon'.
-- Allow all operations for simplicity (single-admin app).
DROP POLICY IF EXISTS "profiles_all" ON profiles;
CREATE POLICY "profiles_all" ON profiles FOR ALL USING (true);

-- Optional: auto-create a profile row when a new auth user is created.
-- Keeps getUserRole() from returning null for brand-new users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_app_meta_data->>'role', 'User'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed existing users as Administrator (single-admin app).
-- User auth yang sudah ada otomatis mendapat akses penuh tanpa perlu
-- mengedit metadata lewat Supabase Dashboard.
-- Hapus/ubah bagian ini jika Anda punya user biasa yang harus dibatasi.
INSERT INTO public.profiles (user_id, role)
SELECT id, 'Administrator'
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET role = 'Administrator';

-- >>> END 00005_create_profiles.sql <<<


-- >>> START 00006_seed_sample_data.sql <<<
-- ============================================================
-- SIHARKAN-TIK: Seed Data Contoh (2 baris per tabel utama)
-- Sumber: rev db/1. DATA ALAT TIK.xlsx & 2. DATA SUKU CADANG.xlsx
-- Jalankan di SQL Editor Supabase setelah migrasi 00001–00005.
-- Aman dijalankan berulang (menggunakan ON CONFLICT / id unik).
-- ============================================================

-- ------------------------------------------------------------
-- 1. INVENTARIS (Alat TIK)
--    Diambil dari rekap asli: HT Motorola Polda DIY (618 B, 189 RR, 7 RB)
--    dan TOWER Polres Sleman (1 unit Baik).
--    id_ht diambil dari kategori + satwil agar konsisten dengan UI.
-- ------------------------------------------------------------

-- Pastikan kategori & satwil sudah ada (dari 00001)
INSERT INTO inventaris (id, nama, merk, kategori_id, kondisi, lokasi_id, tgl)
VALUES
  (
    'HT-MTR-001',
    'Radio HT Motorola APX 1000',
    'Motorola',
    (SELECT id FROM kategori WHERE nama = 'HT'),
    'Baik',
    (SELECT id FROM satwil WHERE nama = 'Mapolda DIY'),
    '2025-01-15'
  ),
  (
    'HT-MTR-002',
    'Radio HT Motorola GP328',
    'Motorola',
    (SELECT id FROM kategori WHERE nama = 'HT'),
    'Rusak Ringan',
    (SELECT id FROM satwil WHERE nama = 'Mapolda DIY'),
    '2025-02-20'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventaris (id, nama, merk, kategori_id, kondisi, lokasi_id, tgl)
VALUES
  (
    'TWR-SLM-001',
    'Tower Telekomunikasi 40m',
    'CommScope',
    (SELECT id FROM kategori WHERE nama = 'Tower'),
    'Baik',
    (SELECT id FROM satwil WHERE nama = 'Polres Sleman'),
    '2024-11-10'
  ),
  (
    'RPT-SLM-001',
    'Repeater Motorola SLR 5500',
    'Motorola',
    (SELECT id FROM kategori WHERE nama = 'Repeater'),
    'Baik',
    (SELECT id FROM satwil WHERE nama = 'Polres Sleman'),
    '2024-12-05'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. SUKU CADANG
--    Diambil dari DATA SUKU CADANG.xlsx (penerimaan 2025):
--    - Sucad portabel Radio APX1000I: terima 50, digunakan 50, sisa 0
--    - Antena omni 10dB 800 MHz: terima 10, digunakan 2, sisa 8
--    min_stok diset 5 sebagai ambang batas pengadaan.
-- ------------------------------------------------------------
INSERT INTO suku_cadang (nama, satuan, stok, min_stok, transaksi_bln, kategori_sc)
VALUES
  ('Sucad portabel Radio APX1000I', 'pcs', 0, 5, 50, 'Radio'),
  ('Antena omni 10dB 800 MHz', 'pcs', 8, 5, 2, 'Antena')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 3. TRACKING (Aduan Perbaikan)
--    Status mengikuti enum: 'Belum Ditindaklanjuti' | 'Proses' | 'Selesai'
-- ------------------------------------------------------------
INSERT INTO tracking (id, satwil_id, jenis, tgl, status, file_url)
VALUES
  (
    'TRK-0001',
    (SELECT id FROM satwil WHERE nama = 'Polres Bantul'),
    'HT Mati Total',
    '2026-07-01',
    'Belum Ditindaklanjuti',
    ''
  ),
  (
    'TRK-0002',
    (SELECT id FROM satwil WHERE nama = 'Polres Sleman'),
    'Antena Repeater Putus',
    '2026-07-05',
    'Proses',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. PINJAMAN (Pinjam Pakai HT)
--    Kolom sudah di-rename menjadi jenis_ht (text) oleh migrasi 00004,
--    berisi jenis/merk HT (sesuai frontend PinjamanHTPage).
--    Migrasi 00004 hanya rename kolom tapi TIDAK menghapus FK lama
--    (pinjaman_id_ht_fkey) yang masih mengikat jenis_ht -> inventaris.id.
--    Karena frontend memperlakukan jenis_ht sebagai teks bebas, kita
--    lepas constraint tersebut agar insert teks jenis HT tidak melanggar FK.
-- ------------------------------------------------------------
ALTER TABLE pinjaman
  DROP CONSTRAINT IF EXISTS pinjaman_id_ht_fkey;

INSERT INTO pinjaman (jenis_ht, satwil_id, tgl_pinjam, tgl_kembali, keterangan, status)
VALUES
  (
    'APX 1000',
    (SELECT id FROM satwil WHERE nama = 'Polres Bantul'),
    '2026-07-08',
    '2026-07-20',
    'Pinjam untuk pengamanan kegiatan',
    'Dipinjam'
  ),
  (
    'APX 1000i',
    (SELECT id FROM satwil WHERE nama = 'Polres Sleman'),
    '2026-07-09',
    '2026-07-15',
    'Pinjam untuk latihan',
    'Dipinjam'
  )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 5. SPPM (Surat Perintah Perbaikan / Pemeliharaan)
--    nomor unik sesuai constraint.
-- ------------------------------------------------------------
INSERT INTO sppm (nomor, sumber, perihal, tgl, file_url)
VALUES
  ('SPPM/001/VI/2026', 'Mabes Polri', 'Pemeliharaan Rutin Radio HT Triwulan II', '2026-06-30', ''),
  ('SPPM/002/VII/2026', 'Polres', 'Penggantian Antena Repeater Polres Sleman', '2026-07-04', '')
ON CONFLICT (nomor) DO NOTHING;

-- >>> END 00006_seed_sample_data.sql <<<


-- >>> START 00007_fix_pinjaman_schema.sql <<<
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

-- >>> END 00007_fix_pinjaman_schema.sql <<<


-- >>> START 00008_normalize_pinjaman_jenis_ht.sql <<<
-- ============================================================
-- SIHARKAN-TIK: Normalize existing pinjaman.jenis_ht to the
-- 4 client-approved HT types.
--
-- Client revision requires the "Jenis HT" field to use exactly:
--   - APX 1000
--   - APX 1000i
--   - Hytera
--   - Tait
--
-- The sample/seed data previously stored free-text merk names
-- (e.g. 'Motorola APX 1000', 'Motorola GP328') which do not match
-- the dropdown options. This migration maps legacy values to the
-- approved types so the table stays consistent with the form.
-- ============================================================

-- Map known legacy values to the approved 4 types.
UPDATE pinjaman
SET jenis_ht = 'APX 1000'
WHERE jenis_ht IN ('Motorola APX 1000', 'Motorola GP328', 'APX 1000', 'Motorola APX 1000i', 'APX 1000i');

UPDATE pinjaman
SET jenis_ht = 'APX 1000i'
WHERE jenis_ht IN ('Motorola APX 1000i');

UPDATE pinjaman
SET jenis_ht = 'Hytera'
WHERE jenis_ht IN ('Hytera', 'Motorola Hytera', 'Hytera PD365', 'Hytera BD502i');

UPDATE pinjaman
SET jenis_ht = 'Tait'
WHERE jenis_ht IN ('Tait', 'Tait TP', 'Tait TP9300');

-- Any remaining legacy value that is not one of the 4 approved
-- types (e.g. other Motorola/Icom/Kenwood models) is normalized to
-- 'APX 1000' as a safe default so no row holds an invalid type.
UPDATE pinjaman
SET jenis_ht = 'APX 1000'
WHERE jenis_ht NOT IN ('APX 1000', 'APX 1000i', 'Hytera', 'Tait');

-- >>> END 00008_normalize_pinjaman_jenis_ht.sql <<<


-- >>> START 00009_fix_schema_real_data.sql <<<
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

-- >>> END 00009_fix_schema_real_data.sql <<<


-- >>> START 0010_seed_real_data.sql <<<
-- ============================================================
-- SIHARKAN-TIK: Seed data ASLI dari folder .ai file
-- Migration 0010
--
-- Sumber:
--   - 1. DATA ALAT TIK.xlsx  -> rekap_inventaris (snapshot)
--   - 2. DATA SUKU CADANG.xlsx (JANUARI 2026) -> suku_cadang (56 item)
--   - PINJAM PAKAI HT (4 PDF) -> inventaris (17 unit unik) + pinjaman (36)
--   - SPPM (4 PDF) -> sppm (4 surat)
--
-- Catatan: 4.184 HT di Excel adalah REKAP, bukan per-unit.
-- Yang dimuat sebagai baris nyata hanya yang punya identitas
-- (serial / suku cadang / surat).
-- ============================================================

-- ------------------------------------------------------------
-- A. SPPM (4 surat asli)
-- ------------------------------------------------------------
INSERT INTO sppm (nomor, sumber, perihal, tgl, file_url) VALUES
  ('SPPM/10/I/LOG.3.10.8/2024/Div TIK', 'Mabes Polri',
   'Pengadaan Harsucad ICT Sumber Pembiayaan LN (KSA) T.A. 2021', '2024-01-31', ''),
  ('Sprin/7446/VIIN/LOG.4.11.8/2025', 'Mabes Polri',
   'Pengadaan Infrastruktur Video Konferensi On-Premise Polri Connect', '2025-08-12', ''),
  ('Sprin/288/LOG.4.11.8/2025', 'Mabes Polri',
   'Harsucad ICT Sumber Pembiayaan LN Program KSA T.A. 2021', '2025-01-24', ''),
  ('B/ND-06/II/LOG.3.10.8/2024/Bid TIK', 'Polres',
   'Rencana Distribusi Suku Cadang Jajaran Polda DIY', '2024-03-04', '')
ON CONFLICT (nomor) DO NOTHING;

-- ------------------------------------------------------------
-- B. SUKU CADANG (56 item dari Excel JANUARI 2026)
--    terima / digunakan / sisa (stok = sisa)
-- ------------------------------------------------------------
INSERT INTO suku_cadang (nama, satuan, terima, digunakan, stok, min_stok, kategori_sc) VALUES
  ('Sucad portabel Radio APX1000I existing', 'pcs', 50, 50, 0, 5, 'Radio'),
  ('Programing cable APX1000 Portabel Radio existing', 'pcs', 4, 0, 4, 2, 'Kabel'),
  ('Earset 3 Wire adaptor Digital Portabel Radio existing', 'pcs', 30, 0, 30, 5, 'Aksesori'),
  ('Power supply fixed station 230 VAC existing', 'pcs', 15, 1, 14, 3, 'Power Supply'),
  ('Antena omni 10dB 800 MHz', 'pcs', 10, 2, 8, 3, 'Antena'),
  ('Antena Mobile Radio 3dB 800 MHz Magneting Base', 'pcs', 40, 0, 40, 5, 'Antena'),
  ('Antena Whip HT APX 1000 800 MHz', 'pcs', 40, 0, 40, 5, 'Antena'),
  ('Antena Yagi 9dB 800 MHz', 'pcs', 15, 0, 15, 3, 'Antena'),
  ('Lightning arrestor for Combiner ex', 'pcs', 5, 0, 5, 2, 'Aksesori'),
  ('Lightning Arestor for Multicoupler ex', 'pcs', 5, 0, 5, 2, 'Aksesori'),
  ('Lightning Arrestor DC block ex', 'pcs', 15, 0, 15, 3, 'Aksesori'),
  ('Surge Protector ex', 'pcs', 5, 0, 5, 2, 'Aksesori'),
  ('Rx Multicoupler dan Top tower Amplifier ex', 'pcs', 1, 0, 1, 1, 'Aksesori'),
  ('Duplexer 800 MHz', 'pcs', 5, 0, 5, 2, 'Aksesori'),
  ('Cable Coaxial 7/8"', 'pcs', 500, 0, 500, 50, 'Kabel'),
  ('Cable Coaxial 1/2"', 'pcs', 100, 0, 100, 20, 'Kabel'),
  ('Cable Flekxible 1/2"', 'pcs', 100, 0, 100, 20, 'Kabel'),
  ('Cable RGB', 'pcs', 300, 0, 300, 50, 'Kabel'),
  ('Connector for Coaxial 7/8" N-Male', 'pcs', 30, 0, 30, 5, 'Konektor'),
  ('Connector for Coaxial 7/8" N-Female', 'pcs', 30, 0, 30, 5, 'Konektor'),
  ('Connector for Coaxial 1/2" N-male', 'pcs', 20, 0, 20, 5, 'Konektor'),
  ('Connector for Coaxial 1/2" N-Female', 'pcs', 20, 0, 20, 5, 'Konektor'),
  ('Connector for Flexibel 1/2" N-Male', 'pcs', 20, 0, 20, 5, 'Konektor'),
  ('Connector for Flexibel 1/2" N-Female', 'pcs', 20, 0, 20, 5, 'Konektor'),
  ('Conector for RG-8 N-Male', 'pcs', 40, 0, 40, 5, 'Konektor'),
  ('Conector for RG-8 N-Female', 'pcs', 10, 0, 10, 3, 'Konektor'),
  ('Connector for RG-8 BNC -Male', 'pcs', 4, 0, 4, 2, 'Konektor'),
  ('Connector for RG58 N Male', 'pcs', 20, 0, 20, 5, 'Konektor'),
  ('Connector for RG58 N Female', 'pcs', 20, 0, 20, 5, 'Konektor'),
  ('Connector Adaptor N Male to N Male', 'pcs', 10, 0, 10, 3, 'Konektor'),
  ('Connector Adaptor N-Female to N-Female', 'pcs', 10, 0, 10, 3, 'Konektor'),
  ('Connector Adaptor N-Female tto BNC-Male', 'pcs', 10, 0, 10, 3, 'Konektor'),
  ('Antena Omnidirectional 4dB 806-866MHz ex', 'pcs', 5, 0, 5, 2, 'Antena'),
  ('Multi Charger Digital Portabel Radio/HT ex', 'pcs', 10, 2, 8, 3, 'Charger'),
  ('Display 55" Hawkeye ex', 'pcs', 10, 1, 9, 3, 'Komponen'),
  ('Watt power meter', 'pcs', 3, 1, 2, 1, 'Alat Ukur'),
  ('CCTV outdoor PTZ camera ex', 'pcs', 10, 1, 9, 3, 'CCTV'),
  ('CCTV outdoor bullet camera ex', 'pcs', 10, 6, 4, 3, 'CCTV'),
  ('Acces Switch Outdoor ex', 'pcs', 5, 5, 0, 2, 'Jaringan'),
  ('Network video recorder (NVR)', 'pcs', 3, 1, 2, 1, 'CCTV'),
  ('Zone Controller Server Appliance', 'pcs', 2, 0, 2, 1, 'Komponen'),
  -- II. Local Content
  ('Digital Multimeter', 'pcs', 2, 1, 1, 1, 'Alat Ukur'),
  ('Cable UTP', 'pcs', 6, 4, 2, 2, 'Kabel'),
  ('Cable Tester RJ45/1', 'pcs', 6, 4, 2, 2, 'Alat Ukur'),
  ('Crimping Tools RJ-45 conector', 'pcs', 6, 4, 2, 2, 'Alat'),
  ('Tollkits Set with Alumunium case', 'pcs', 2, 1, 1, 1, 'Alat'),
  ('GPS Navigation Garmin 5"', 'pcs', 5, 3, 2, 2, 'Alat'),
  ('Router Board 1100 microtic', 'pcs', 11, 7, 4, 3, 'Jaringan'),
  ('Router Board 450 microtic', 'pcs', 16, 9, 7, 3, 'Jaringan'),
  ('Full Body harness', 'pcs', 5, 0, 5, 2, 'Alat'),
  ('UPS 18KVA dan Battery Bank', 'pcs', 1, 0, 1, 1, 'Power Supply'),
  ('UPS 3KVA for RBS Trunking dan Dispatch Console', 'pcs', 1, 1, 0, 1, 'Power Supply'),
  ('Interface Radio Link', 'pcs', 2, 0, 2, 1, 'Radio'),
  ('Battery backup repeater 12V/100AH', 'pcs', 20, 12, 8, 5, 'Baterai'),
  ('Electricity Protection 5 KVA', 'pcs', 5, 0, 5, 2, 'Power Supply'),
  ('Laptop for Monitoring Display', 'pcs', 1, 1, 0, 1, 'Komponen')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- C. INVENTARIS (17 unit unik berserial dari 4 PDF pinjam)
--    id_ht = HT-REAL-001 .. HT-REAL-017
-- ------------------------------------------------------------
INSERT INTO inventaris (id, nama, merk, model, serial_number, kategori_id, kondisi, lokasi_id, tgl) VALUES
  ('HT-REAL-001', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB5774/750901', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-002', 'HT APX 1000', 'Motorola', 'APX 1000', '837TTY2756/743256', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-003', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB5481/743309', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-004', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB4487/743268', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-005', 'HT APX 1000', 'Motorola', 'APX 1000', '837TSM0187/743244', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-006', 'HT APX 1000', 'Motorola', 'APX 1000', '837TTY2752/743245', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-007', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUD0281/250908', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-008', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUD0174/742576', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-009', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB6041/750004', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-010', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB4816/743265', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-011', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB4590/743248', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-012', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB3876/750899', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-013', 'HT APX 1000', 'Motorola', 'APX 1000', '837TSM0047/750903', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-014', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUD0583/750016', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-015', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUD0596/750006', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-016', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB5084/742232', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-12-01'),
  ('HT-REAL-017', 'HT APX 1000', 'Motorola', 'APX 1000', '837TUB5314/000000', (SELECT id FROM kategori WHERE nama='HT'), 'Baik', (SELECT id FROM satwil WHERE nama='Mapolda DIY'), '2025-11-05')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- D. PINJAMAN (36 transaksi dari 4 PDF)
--    id_ht diisi untuk 17 unit unik; sisanya NULL (serial tetap tercatat)
-- ------------------------------------------------------------
-- Pinjam 1: Polresta Yogyakarta (15 unit, kembali)
INSERT INTO pinjaman (id_ht, serial_number, merk, model, jenis_ht, satwil_id, tgl_pinjam, tgl_kembali, keterangan, status, is_returned)
SELECT v.id_ht, v.serial, 'Motorola', 'APX 1000', 'APX 1000',
       (SELECT id FROM satwil WHERE nama='Polresta Yogyakarta'),
       '2025-12-01', '2025-12-31',
       'Pinjam Pakai HT Polresta Yogyakarta (Surat B/130/I/TIK.7.7/2026)',
       'Dikembalikan', true
FROM (VALUES
  ('HT-REAL-002','837TTY2756/743256'),('HT-REAL-003','837TUB5481/743309'),
  ('HT-REAL-004','837TUB4487/743268'),('HT-REAL-005','837TSM0187/743244'),
  ('HT-REAL-006','837TTY2752/743245'),('HT-REAL-007','837TUD0281/250908'),
  ('HT-REAL-008','837TUD0174/742576'),('HT-REAL-009','837TUB6041/750004'),
  ('HT-REAL-010','837TUB4816/743265'),('HT-REAL-011','837TUB4590/743248'),
  ('HT-REAL-012','837TUB3876/750899'),('HT-REAL-013','837TSM0047/750903'),
  ('HT-REAL-014','837TUD0583/750016'),('HT-REAL-015','837TUD0596/750006'),
  ('HT-REAL-001','837TUB5774/750901')
) AS v(id_ht, serial)
ON CONFLICT (id_ht, serial_number, tgl_pinjam) DO NOTHING;

-- Pinjam 2: Dit Samapta Polda DIY (15 unit, Ops Lilin Progo 2025)
INSERT INTO pinjaman (id_ht, serial_number, merk, model, jenis_ht, satwil_id, tgl_pinjam, tgl_kembali, keterangan, status, is_returned)
SELECT v.id_ht, v.serial, 'Motorola', 'APX 1000', 'APX 1000',
       (SELECT id FROM satwil WHERE nama='Mapolda DIY'),
       '2025-12-18', '2026-01-10',
       'Pinjam Pakai HT Dit Samapta (Surat B/554/XII/DIK.2.6/2025/Ditsamapta) - Ops Lilin Progo 2025',
       'Dikembalikan', true
FROM (VALUES
  ('HT-REAL-001','837TUB5774/750901'),('HT-REAL-002','837TTY2756/743256'),
  ('HT-REAL-003','837TUB5481/743309'),('HT-REAL-004','837TUB4487/743268'),
  ('HT-REAL-005','837TSM0187/743244'),('HT-REAL-006','837TTY2752/743245'),
  ('HT-REAL-007','837TUD0281/250908'),('HT-REAL-008','837TUD0174/742576'),
  ('HT-REAL-009','837TUB6041/750004'),('HT-REAL-010','837TUB4816/743265'),
  ('HT-REAL-011','837TUB4590/743248'),('HT-REAL-012','837TUB3876/750899'),
  ('HT-REAL-013','837TSM0047/750903'),('HT-REAL-014','837TUD0583/750016'),
  ('HT-REAL-015','837TUD0596/750006')
) AS v(id_ht, serial)
ON CONFLICT ON CONSTRAINT uq_pinjaman_unit DO NOTHING;

-- Pinjam 3: Posko Ops Lilin Progo (1 unit)
INSERT INTO pinjaman (id_ht, serial_number, merk, model, jenis_ht, satwil_id, tgl_pinjam, tgl_kembali, keterangan, status, is_returned)
VALUES ('HT-REAL-016','837TUB5084/742232','Motorola','APX 1000','APX 1000',
       (SELECT id FROM satwil WHERE nama='Mapolda DIY'),
       '2025-12-20','2026-01-05',
       'Pinjam Pakai HT Posko Ops Lilin Progo 2025', 'Dikembalikan', true)
ON CONFLICT ON CONSTRAINT uq_pinjaman_unit DO NOTHING;

-- Pinjam 4: Ditbinmas Polda DIY (5 unit, Rakernis Baharkam)
INSERT INTO pinjaman (id_ht, serial_number, merk, model, jenis_ht, satwil_id, tgl_pinjam, tgl_kembali, keterangan, status, is_returned)
SELECT v.id_ht, v.serial, 'Motorola', 'APX 1000', 'APX 1000',
       (SELECT id FROM satwil WHERE nama='Mapolda DIY'),
       '2025-11-05', '2025-11-10',
       'Pinjam Pakai HT Ditbinmas (Nota Dinas B/ND-298/XI/LIT.5/2025/Ditbinmas) - Rakernis Baharkam Polri TA 2025',
       'Dikembalikan', true
FROM (VALUES
  ('HT-REAL-011','837TUB4590/743248'),('HT-REAL-007','837TUD0281/250908'),
  ('HT-REAL-017','837TUB5314/000000'),('HT-REAL-004','837TUB4487/743268'),
  ('HT-REAL-015','837TUD0596/750006')
) AS v(id_ht, serial)
ON CONFLICT ON CONSTRAINT uq_pinjaman_unit DO NOTHING;

-- ------------------------------------------------------------
-- E. REKAP_INVENTARIS (snapshot dari Excel REKAP DATA)
--    Total HT = 4.184 (agregat, bukan per-unit)
-- ------------------------------------------------------------
INSERT INTO rekap_inventaris (satwil, kategori, merk, kondisi, jumlah) VALUES
  -- HT Motorola
  ('Mapolda DIY','HT','Motorola','Baik',618),('Mapolda DIY','HT','Motorola','Rusak Ringan',189),('Mapolda DIY','HT','Motorola','Rusak Berat',7),
  ('Polresta Yogyakarta','HT','Motorola','Baik',226),('Polresta Yogyakarta','HT','Motorola','Rusak Ringan',281),('Polresta Yogyakarta','HT','Motorola','Rusak Berat',13),
  ('Polres Bantul','HT','Motorola','Baik',519),('Polres Bantul','HT','Motorola','Rusak Ringan',17),
  ('Polres Sleman','HT','Motorola','Baik',723),('Polres Sleman','HT','Motorola','Rusak Ringan',1),
  ('Polres Kulon Progo','HT','Motorola','Baik',436),('Polres Kulon Progo','HT','Motorola','Rusak Ringan',41),
  ('Polres Gunungkidul','HT','Motorola','Baik',714),('Polres Gunungkidul','HT','Motorola','Rusak Ringan',1),
  -- HT Hytera
  ('Mapolda DIY','HT','Hytera','Baik',133),
  ('Polresta Yogyakarta','HT','Hytera','Baik',65),
  ('Polres Bantul','HT','Hytera','Baik',45),
  ('Polres Sleman','HT','Hytera','Baik',65),
  ('Polres Kulon Progo','HT','Hytera','Baik',45),
  ('Polres Gunungkidul','HT','Hytera','Baik',45),
  -- Repeater
  ('Mapolda DIY','Repeater','Motorola GTR','Rusak Berat',7),
  ('Mapolda DIY','Repeater','Motorola MTR','Rusak Berat',2),
  ('Mapolda DIY','Repeater','Motorola Quantar','Baik',7),
  ('Polres Bantul','Repeater','Motorola GTR','Baik',1),
  ('Polres Gunungkidul','Repeater','Motorola GTR','Baik',6),('Polres Gunungkidul','Repeater','Motorola MTR','Baik',1),
  ('Polres Kulon Progo','Repeater','Motorola','Baik',2),
  ('Polres Sleman','Repeater','Motorola','Baik',1),
  ('Polresta Yogyakarta','Repeater','Motorola','Baik',1),
  -- Ransus
  ('Mapolda DIY','Ransus','R4 DF','Baik',1),
  ('Mapolda DIY','Ransus','R4 Fly Way','Baik',4),
  -- Lainnya
  ('Mapolda DIY','Command Center','','Baik',1),
  ('Mapolda DIY','Call Center','','Baik',1),
  ('Mapolda DIY','Drone','Multicopter','Baik',1),
  -- Tower (per satwil)
  ('Mapolda DIY','Tower','','Baik',2),
  ('Polres Bantul','Tower','','Baik',1),
  ('Polres Gunungkidul','Tower','','Baik',4),
  ('Polres Kulon Progo','Tower','','Baik',2),
  ('Polres Sleman','Tower','','Baik',1),
  ('Polresta Yogyakarta','Tower','','Baik',1),
  ('Non Polri','Tower','','Baik',2)
ON CONFLICT DO NOTHING;

-- >>> END 0010_seed_real_data.sql <<<


-- >>> START 0011_inventory_batch_mutations.sql <<<
-- SIHARKAN-TIK inventory quantity and mutation model
CREATE TABLE IF NOT EXISTS inventaris_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  merk VARCHAR(100) NOT NULL DEFAULT '',
  model VARCHAR(100) NOT NULL DEFAULT '',
  kategori_id UUID NOT NULL REFERENCES kategori(id),
  lokasi_id UUID NOT NULL REFERENCES satwil(id),
  kondisi VARCHAR(30) NOT NULL DEFAULT 'Baik',
  jumlah_awal INTEGER NOT NULL CHECK (jumlah_awal > 0),
  jumlah_tersedia INTEGER NOT NULL CHECK (jumlah_tersedia >= 0),
  jumlah_dipinjam INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_dipinjam >= 0),
  jumlah_rusak INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_rusak >= 0),
  jumlah_hilang INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_hilang >= 0),
  satuan VARCHAR(30) NOT NULL DEFAULT 'unit',
  nomor_batch VARCHAR(100),
  tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
  sumber_pengadaan VARCHAR(255) NOT NULL DEFAULT 'Input baru',
  keterangan TEXT NOT NULL DEFAULT '',
  is_legacy BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventaris_batch_balance_check CHECK (jumlah_tersedia + jumlah_dipinjam + jumlah_rusak + jumlah_hilang <= jumlah_awal)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventaris_batch_nomor ON inventaris_batch(nomor_batch) WHERE nomor_batch IS NOT NULL AND nomor_batch <> '';
CREATE INDEX IF NOT EXISTS idx_inventaris_batch_kategori ON inventaris_batch(kategori_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_batch_lokasi ON inventaris_batch(lokasi_id);
CREATE INDEX IF NOT EXISTS idx_inventaris_batch_tanggal ON inventaris_batch(tanggal_masuk);

CREATE TABLE IF NOT EXISTS inventaris_mutasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES inventaris_batch(id),
  inventaris_id VARCHAR(20) REFERENCES inventaris(id),
  jenis_mutasi VARCHAR(30) NOT NULL CHECK (jenis_mutasi IN ('MASUK','PINJAM','KEMBALI','RUSAK','HILANG','PINDAH','KOREKSI_PLUS','KOREKSI_MINUS','PERBAIKAN','SELESAI_PERBAIKAN')),
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal_transaksi DATE NOT NULL DEFAULT CURRENT_DATE,
  lokasi_asal_id UUID REFERENCES satwil(id),
  lokasi_tujuan_id UUID REFERENCES satwil(id),
  referensi_fitur VARCHAR(50) NOT NULL DEFAULT 'Inventaris',
  referensi_id UUID,
  nomor_transaksi VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'Selesai',
  keterangan TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventaris_mutasi_target_check CHECK ((batch_id IS NOT NULL) OR (inventaris_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_inventaris_mutasi_tanggal ON inventaris_mutasi(tanggal_transaksi);
CREATE INDEX IF NOT EXISTS idx_inventaris_mutasi_batch ON inventaris_mutasi(batch_id);

ALTER TABLE pinjaman ADD COLUMN IF NOT EXISTS jumlah INTEGER NOT NULL DEFAULT 1 CHECK (jumlah > 0);
ALTER TABLE pinjaman ADD COLUMN IF NOT EXISTS jumlah_dikembalikan INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_dikembalikan >= 0);
ALTER TABLE pinjaman ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES inventaris_batch(id);
ALTER TABLE pinjaman ADD COLUMN IF NOT EXISTS nomor_transaksi VARCHAR(100);
ALTER TABLE pinjaman ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE inventaris_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaris_mutasi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventaris_batch_read ON inventaris_batch;
CREATE POLICY inventaris_batch_read ON inventaris_batch FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS inventaris_batch_write ON inventaris_batch;
CREATE POLICY inventaris_batch_write ON inventaris_batch FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS inventaris_mutasi_read ON inventaris_mutasi;
CREATE POLICY inventaris_mutasi_read ON inventaris_mutasi FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS inventaris_mutasi_write ON inventaris_mutasi;
CREATE POLICY inventaris_mutasi_write ON inventaris_mutasi FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION create_inventaris_batch(
  p_nama TEXT, p_merk TEXT, p_model TEXT, p_kategori_id UUID, p_lokasi_id UUID,
  p_kondisi TEXT, p_jumlah INTEGER, p_satuan TEXT, p_nomor_batch TEXT,
  p_tanggal_masuk DATE, p_sumber_pengadaan TEXT, p_keterangan TEXT
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_id UUID;
BEGIN
  IF p_jumlah IS NULL OR p_jumlah <= 0 THEN RAISE EXCEPTION 'Jumlah harus lebih besar dari nol'; END IF;
  INSERT INTO inventaris_batch (nama, merk, model, kategori_id, lokasi_id, kondisi, jumlah_awal, jumlah_tersedia, satuan, nomor_batch, tanggal_masuk, sumber_pengadaan, keterangan, created_by)
  VALUES (p_nama, COALESCE(p_merk,''), COALESCE(p_model,''), p_kategori_id, p_lokasi_id, COALESCE(p_kondisi,'Baik'), p_jumlah, p_jumlah, COALESCE(p_satuan,'unit'), NULLIF(p_nomor_batch,''), COALESCE(p_tanggal_masuk,CURRENT_DATE), COALESCE(p_sumber_pengadaan,'Input baru'), COALESCE(p_keterangan,''), auth.uid()) RETURNING id INTO v_id;
  INSERT INTO inventaris_mutasi (batch_id, jenis_mutasi, jumlah, tanggal_transaksi, referensi_fitur, keterangan, created_by)
  VALUES (v_id, 'MASUK', p_jumlah, COALESCE(p_tanggal_masuk,CURRENT_DATE), 'Inventaris', 'Stok awal batch', auth.uid());
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION create_inventaris_batch TO authenticated;

CREATE OR REPLACE FUNCTION mutate_inventaris_batch(p_batch_id UUID, p_jenis TEXT, p_jumlah INTEGER, p_tanggal DATE, p_keterangan TEXT DEFAULT '') RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE v_batch inventaris_batch; v_available INTEGER;
BEGIN
  IF p_jumlah IS NULL OR p_jumlah <= 0 THEN RAISE EXCEPTION 'Jumlah mutasi tidak valid'; END IF;
  SELECT * INTO v_batch FROM inventaris_batch WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch tidak ditemukan'; END IF;
  IF p_jenis = 'PINJAM' THEN
    IF v_batch.jumlah_tersedia < p_jumlah THEN RAISE EXCEPTION 'Stok tersedia tidak mencukupi'; END IF;
    UPDATE inventaris_batch SET jumlah_tersedia=jumlah_tersedia-p_jumlah, jumlah_dipinjam=jumlah_dipinjam+p_jumlah, updated_at=now() WHERE id=p_batch_id;
  ELSIF p_jenis = 'KEMBALI' THEN
    IF v_batch.jumlah_dipinjam < p_jumlah THEN RAISE EXCEPTION 'Jumlah pengembalian melebihi jumlah dipinjam'; END IF;
    UPDATE inventaris_batch SET jumlah_tersedia=jumlah_tersedia+p_jumlah, jumlah_dipinjam=jumlah_dipinjam-p_jumlah, updated_at=now() WHERE id=p_batch_id;
  ELSIF p_jenis = 'RUSAK' THEN
    IF v_batch.jumlah_tersedia < p_jumlah THEN RAISE EXCEPTION 'Stok tersedia tidak mencukupi'; END IF;
    UPDATE inventaris_batch SET jumlah_tersedia=jumlah_tersedia-p_jumlah, jumlah_rusak=jumlah_rusak+p_jumlah, updated_at=now() WHERE id=p_batch_id;
  ELSIF p_jenis = 'HILANG' THEN
    IF v_batch.jumlah_tersedia < p_jumlah THEN RAISE EXCEPTION 'Stok tersedia tidak mencukupi'; END IF;
    UPDATE inventaris_batch SET jumlah_tersedia=jumlah_tersedia-p_jumlah, jumlah_hilang=jumlah_hilang+p_jumlah, updated_at=now() WHERE id=p_batch_id;
  ELSIF p_jenis = 'KOREKSI_PLUS' THEN
    UPDATE inventaris_batch SET jumlah_awal=jumlah_awal+p_jumlah, jumlah_tersedia=jumlah_tersedia+p_jumlah, updated_at=now() WHERE id=p_batch_id;
  ELSIF p_jenis = 'KOREKSI_MINUS' THEN
    IF v_batch.jumlah_tersedia < p_jumlah THEN RAISE EXCEPTION 'Stok tersedia tidak mencukupi'; END IF;
    UPDATE inventaris_batch SET jumlah_awal=jumlah_awal-p_jumlah, jumlah_tersedia=jumlah_tersedia-p_jumlah, updated_at=now() WHERE id=p_batch_id;
  ELSE RAISE EXCEPTION 'Jenis mutasi tidak didukung'; END IF;
  INSERT INTO inventaris_mutasi (batch_id, jenis_mutasi, jumlah, tanggal_transaksi, referensi_fitur, keterangan, created_by) VALUES (p_batch_id,p_jenis,p_jumlah,COALESCE(p_tanggal,CURRENT_DATE),'Inventaris',COALESCE(p_keterangan,''),auth.uid());
  SELECT jumlah_tersedia INTO v_available FROM inventaris_batch WHERE id=p_batch_id;
  RETURN json_build_object('batch_id', p_batch_id, 'jumlah_tersedia', v_available);
END; $$;
GRANT EXECUTE ON FUNCTION mutate_inventaris_batch TO authenticated;

CREATE OR REPLACE FUNCTION create_pinjaman_batch(
  p_batch_id UUID, p_jumlah INTEGER, p_satwil_id UUID, p_tgl_pinjam DATE,
  p_tgl_kembali DATE, p_keterangan TEXT DEFAULT '', p_jenis_ht TEXT DEFAULT '',
  p_merk TEXT DEFAULT '', p_model TEXT DEFAULT '', p_nomor_transaksi TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_batch inventaris_batch; v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Pengguna harus terautentikasi'; END IF;
  IF p_jumlah IS NULL OR p_jumlah <= 0 THEN RAISE EXCEPTION 'Jumlah pinjaman tidak valid'; END IF;
  IF p_satwil_id IS NULL THEN RAISE EXCEPTION 'Satwil peminjam harus diisi'; END IF;
  SELECT * INTO v_batch FROM inventaris_batch WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch tidak ditemukan'; END IF;
  IF v_batch.jumlah_tersedia < p_jumlah THEN RAISE EXCEPTION 'Stok tersedia tidak mencukupi'; END IF;

  INSERT INTO pinjaman (jenis_ht, merk, model, satwil_id, tgl_pinjam, tgl_kembali, keterangan, status, is_returned, jumlah, jumlah_dikembalikan, batch_id, nomor_transaksi, created_by)
  VALUES (COALESCE(NULLIF(p_jenis_ht,''),v_batch.nama), COALESCE(NULLIF(p_merk,''),v_batch.merk), COALESCE(NULLIF(p_model,''),v_batch.model), p_satwil_id, p_tgl_pinjam, p_tgl_kembali, COALESCE(p_keterangan,''), 'Dipinjam', false, p_jumlah, 0, p_batch_id, p_nomor_transaksi, auth.uid())
  RETURNING id INTO v_id;

  UPDATE inventaris_batch SET jumlah_tersedia=jumlah_tersedia-p_jumlah, jumlah_dipinjam=jumlah_dipinjam+p_jumlah, updated_at=now() WHERE id=p_batch_id;
  INSERT INTO inventaris_mutasi (batch_id, jenis_mutasi, jumlah, tanggal_transaksi, lokasi_asal_id, lokasi_tujuan_id, referensi_fitur, referensi_id, nomor_transaksi, keterangan, created_by)
  VALUES (p_batch_id, 'PINJAM', p_jumlah, COALESCE(p_tgl_pinjam,CURRENT_DATE), v_batch.lokasi_id, p_satwil_id, 'PinjamanHT', v_id, p_nomor_transaksi, COALESCE(p_keterangan,''), auth.uid());
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION create_pinjaman_batch(UUID,INTEGER,UUID,DATE,DATE,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_pinjaman_batch(UUID,INTEGER,UUID,DATE,DATE,TEXT,TEXT,TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION return_pinjaman_batch(p_pinjaman_id UUID, p_jumlah INTEGER) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE v_pinjaman pinjaman; v_batch inventaris_batch; v_sisa INTEGER; v_total_kembali INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Pengguna harus terautentikasi'; END IF;
  IF p_jumlah IS NULL OR p_jumlah <= 0 THEN RAISE EXCEPTION 'Jumlah pengembalian tidak valid'; END IF;
  SELECT * INTO v_pinjaman FROM pinjaman WHERE id=p_pinjaman_id FOR UPDATE;
  IF NOT FOUND OR v_pinjaman.batch_id IS NULL THEN RAISE EXCEPTION 'Pinjaman batch tidak ditemukan'; END IF;
  v_sisa := v_pinjaman.jumlah-v_pinjaman.jumlah_dikembalikan;
  IF p_jumlah > v_sisa THEN RAISE EXCEPTION 'Jumlah pengembalian melebihi sisa pinjaman'; END IF;
  SELECT * INTO v_batch FROM inventaris_batch WHERE id=v_pinjaman.batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch tidak ditemukan'; END IF;
  IF v_batch.jumlah_dipinjam < p_jumlah THEN RAISE EXCEPTION 'Stok dipinjam tidak konsisten'; END IF;
  v_total_kembali := v_pinjaman.jumlah_dikembalikan+p_jumlah;

  UPDATE pinjaman SET jumlah_dikembalikan=v_total_kembali, is_returned=(v_total_kembali=jumlah), status=CASE WHEN v_total_kembali=jumlah THEN 'Dikembalikan'::status_pinjaman ELSE 'Dipinjam'::status_pinjaman END, tgl_dikembalikan=CASE WHEN v_total_kembali=jumlah THEN now() ELSE NULL END WHERE id=p_pinjaman_id;
  UPDATE inventaris_batch SET jumlah_tersedia=jumlah_tersedia+p_jumlah, jumlah_dipinjam=jumlah_dipinjam-p_jumlah, updated_at=now() WHERE id=v_pinjaman.batch_id;
  INSERT INTO inventaris_mutasi (batch_id, jenis_mutasi, jumlah, tanggal_transaksi, lokasi_asal_id, lokasi_tujuan_id, referensi_fitur, referensi_id, nomor_transaksi, keterangan, created_by)
  VALUES (v_pinjaman.batch_id, 'KEMBALI', p_jumlah, CURRENT_DATE, v_pinjaman.satwil_id, v_batch.lokasi_id, 'PinjamanHT', p_pinjaman_id, v_pinjaman.nomor_transaksi, 'Pengembalian pinjaman batch', auth.uid());
  RETURN json_build_object('pinjaman_id',p_pinjaman_id,'jumlah_dikembalikan',v_total_kembali,'sisa',v_pinjaman.jumlah-v_total_kembali,'is_returned',v_total_kembali=v_pinjaman.jumlah);
END; $$;
REVOKE ALL ON FUNCTION return_pinjaman_batch(UUID,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION return_pinjaman_batch(UUID,INTEGER) TO authenticated;

-- >>> END 0011_inventory_batch_mutations.sql <<<


-- >>> START 0012_inventory_integrity.sql <<<
CREATE OR REPLACE FUNCTION delete_pinjaman_batch(p_pinjaman_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_pinjaman pinjaman;
  v_batch inventaris_batch;
  v_sisa INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Pengguna harus terautentikasi'; END IF;
  SELECT * INTO v_pinjaman FROM pinjaman WHERE id = p_pinjaman_id AND batch_id IS NOT NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pinjaman batch tidak ditemukan'; END IF;
  v_sisa := v_pinjaman.jumlah - v_pinjaman.jumlah_dikembalikan;
  IF v_sisa > 0 THEN
    SELECT * INTO v_batch FROM inventaris_batch WHERE id = v_pinjaman.batch_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Batch tidak ditemukan'; END IF;
    IF v_batch.jumlah_dipinjam < v_sisa THEN RAISE EXCEPTION 'Stok dipinjam tidak konsisten'; END IF;
    UPDATE inventaris_batch SET jumlah_tersedia = jumlah_tersedia + v_sisa, jumlah_dipinjam = jumlah_dipinjam - v_sisa, updated_at = now() WHERE id = v_pinjaman.batch_id;
    INSERT INTO inventaris_mutasi (batch_id, jenis_mutasi, jumlah, tanggal_transaksi, lokasi_asal_id, lokasi_tujuan_id, referensi_fitur, referensi_id, nomor_transaksi, keterangan, created_by)
    VALUES (v_pinjaman.batch_id, 'KEMBALI', v_sisa, CURRENT_DATE, v_pinjaman.satwil_id, v_batch.lokasi_id, 'PinjamanHT', p_pinjaman_id, v_pinjaman.nomor_transaksi, 'Pembatalan pinjaman batch', auth.uid());
  END IF;
  DELETE FROM pinjaman WHERE id = p_pinjaman_id;
  RETURN json_build_object('pinjaman_id', p_pinjaman_id, 'dikembalikan', v_sisa);
END; $$;
REVOKE ALL ON FUNCTION delete_pinjaman_batch(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_pinjaman_batch(UUID) TO authenticated;

ALTER TABLE inventaris_batch DROP CONSTRAINT IF EXISTS inventaris_batch_balance_check;
ALTER TABLE inventaris_batch ADD CONSTRAINT inventaris_batch_balance_check CHECK (jumlah_tersedia + jumlah_dipinjam + jumlah_rusak + jumlah_hilang = jumlah_awal);
REVOKE ALL ON FUNCTION create_inventaris_batch(TEXT,TEXT,TEXT,UUID,UUID,TEXT,INTEGER,TEXT,TEXT,DATE,TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION mutate_inventaris_batch(UUID,TEXT,INTEGER,DATE,TEXT) FROM PUBLIC;

-- >>> END 0012_inventory_integrity.sql <<<


-- >>> START 0013_fix_inventory_delete_cascade.sql <<<
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

-- >>> END 0013_fix_inventory_delete_cascade.sql <<<
