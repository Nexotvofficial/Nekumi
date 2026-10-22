-- 1. Crear la tabla de Reseñas (Comentarios y Estrellas)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid default gen_random_uuid() primary key,
  manhwa_id uuid references manhwas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Compatibilidad si la tabla se creó con una versión anterior.
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS avatar_key TEXT DEFAULT 'hunter';

-- 2. Activar la seguridad de la tabla de Reseñas
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para las Reseñas
-- Cualquier persona puede ver las reseñas
DROP POLICY IF EXISTS "Permitir leer reseñas a todos" ON public.reviews;
CREATE POLICY "Permitir leer reseñas a todos"
ON public.reviews FOR SELECT USING (true);

-- Solo los usuarios logueados pueden escribir reseñas
DROP POLICY IF EXISTS "Permitir crear reseñas a usuarios logueados" ON public.reviews;
CREATE POLICY "Permitir crear reseñas a usuarios logueados"
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Dar permiso al Administrador para EDITAR manhwas
-- (Anteriormente solo tenías permiso de crearlos, esto permite editarlos)
DROP POLICY IF EXISTS "Permitir editar manhwas al admin" ON public.manhwas;
CREATE POLICY "Permitir editar manhwas al admin"
ON public.manhwas FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'diazmowi07@gmail.com');
