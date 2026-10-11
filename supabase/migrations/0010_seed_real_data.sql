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
