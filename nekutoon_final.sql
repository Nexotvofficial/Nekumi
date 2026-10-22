-- ============================================
-- NEKUTOON - Script SQL Completo Fase Final
-- Ejecutar en: Supabase > SQL Editor
-- ============================================

-- 1. Columnas faltantes en la tabla manhwas
ALTER TABLE manhwas ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT false;
ALTER TABLE manhwas ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Tabla de perfiles de usuario (para avatar y username)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  avatar_url TEXT DEFAULT 'hunter',
  username TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de reseñas (con soporte de avatar)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manhwa_id UUID REFERENCES manhwas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  avatar_key TEXT DEFAULT 'hunter',
  rating INT CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Seguridad (RLS) para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Seguridad (RLS) para reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- 6. Función automática para crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_url, username)
  VALUES (
    NEW.id,
    'hunter',
    split_part(NEW.email, '@', 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger que crea el perfil automáticamente cuando alguien se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
