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
