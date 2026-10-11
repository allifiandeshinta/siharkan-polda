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
