-- Nekutoon: guardar progreso del lector (XP, rango, NekuCoins, cosméticos) en la nube
-- Pegar en Supabase -> SQL Editor -> Run

alter table public.profiles
  add column if not exists reader_progress jsonb not null default '{}'::jsonb;

-- Asegurar que cada usuario solo pueda leer/editar SU propio perfil
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
