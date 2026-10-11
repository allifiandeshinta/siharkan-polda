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

CREATE INDEX idx_sppm_sumber ON ppjm(sumber);
CREATE INDEX idx_sppm_tgl ON ppjm(tgl DESC);

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
