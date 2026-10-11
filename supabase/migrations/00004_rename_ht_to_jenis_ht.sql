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
