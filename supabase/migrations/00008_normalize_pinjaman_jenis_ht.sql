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
