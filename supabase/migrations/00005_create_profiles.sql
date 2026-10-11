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
