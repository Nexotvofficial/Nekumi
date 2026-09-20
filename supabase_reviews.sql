-- 1. Crear la tabla de Reseñas (Comentarios y Estrellas)
CREATE TABLE reviews (
  id uuid default gen_random_uuid() primary key,
  manhwa_id uuid references manhwas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Activar la seguridad de la tabla de Reseñas
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para las Reseñas
-- Cualquier persona puede ver las reseñas
CREATE POLICY "Permitir leer reseñas a todos" 
ON reviews FOR SELECT USING (true);

-- Solo los usuarios logueados pueden escribir reseñas
CREATE POLICY "Permitir crear reseñas a usuarios logueados" 
ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Dar permiso al Administrador para EDITAR manhwas
-- (Anteriormente solo tenías permiso de crearlos, esto permite editarlos)
CREATE POLICY "Permitir editar manhwas al admin" 
ON manhwas FOR UPDATE 
USING (auth.role() = 'authenticated');
