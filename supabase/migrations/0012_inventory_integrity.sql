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
