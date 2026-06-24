-- ================================================================
--  POLLA MUNDIALISTA 2026 — Supabase Schema
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. PROFILES (vinculado a auth.users)
create table public.profiles (
  id         uuid    references auth.users(id) on delete cascade primary key,
  name       text    not null,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. POLLAS (una por usuario)
create table public.pollas (
  id               uuid    primary key default gen_random_uuid(),
  user_id          uuid    references public.profiles(id) on delete cascade not null unique,
  scores           jsonb   not null default '{}',
  bracket          jsonb   not null default '{}',
  bonuses          jsonb   not null default '{}',
  manual_bonus_pts jsonb   not null default '{}',
  is_groups_locked boolean not null default false,
  updated_at       timestamptz not null default now()
);

-- 3. RESULTADOS OFICIALES (fila única id=1, solo admin escribe)
create table public.official_results (
  id         int     primary key default 1,
  scores     jsonb   not null default '{}',
  bracket    jsonb   not null default '{}',
  bonuses    jsonb   not null default '{}',
  updated_at timestamptz
);

-- Sembrar fila única
insert into public.official_results (id, scores, bracket, bonuses)
values (1, '{}', '{}', '{}')
on conflict (id) do nothing;

-- ================================================================
--  ROW LEVEL SECURITY
-- ================================================================
alter table public.profiles        enable row level security;
alter table public.pollas          enable row level security;
alter table public.official_results enable row level security;

-- ---- PROFILES ----
create policy "perfiles_select"
  on public.profiles for select to authenticated, anon using (true);

create policy "perfil_update_propio"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- POLLAS ----
create policy "pollas_select"
  on public.pollas for select to authenticated, anon using (true);

create policy "polla_insert_propia"
  on public.pollas for insert to authenticated
  with check (auth.uid() = user_id);

create policy "polla_update_propia"
  on public.pollas for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id AND
    CASE
      -- Si YA está bloqueado en DB: solo puede cambiar bracket, nunca desbloquear
      WHEN (select is_groups_locked from public.pollas where user_id = auth.uid())
      THEN
        is_groups_locked = true
        AND scores  IS NOT DISTINCT FROM (select scores  from public.pollas where user_id = auth.uid())
        AND bonuses IS NOT DISTINCT FROM (select bonuses from public.pollas where user_id = auth.uid())
      -- Si no está bloqueado: puede hacer cualquier cambio en su fila
      ELSE true
    END
  );

-- Admin puede actualizar manual_bonus_pts en cualquier polla
create policy "polla_update_admin"
  on public.pollas for update to authenticated
  using  ((select is_admin from public.profiles where id = auth.uid()))
  with check ((select is_admin from public.profiles where id = auth.uid()));

-- ---- OFFICIAL RESULTS ----
create policy "resultados_select"
  on public.official_results for select to authenticated, anon using (true);

create policy "resultados_insert_admin"
  on public.official_results for insert to authenticated
  with check ((select is_admin from public.profiles where id = auth.uid()));

create policy "resultados_update_admin"
  on public.official_results for update to authenticated
  using  ((select is_admin from public.profiles where id = auth.uid()))
  with check ((select is_admin from public.profiles where id = auth.uid()));

-- ================================================================
--  TRIGGER: auto-crear perfil cuando se registra un usuario
-- ================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
--  CREAR PRIMER ADMIN
--  Después de crear el usuario vía Supabase Dashboard → Authentication,
--  ejecuta esto reemplazando el email:
-- ================================================================
-- update public.profiles
-- set is_admin = true
-- where id = (select id from auth.users where email = 'tu@email.com');

-- ================================================================
--  MIGRACIONES (ejecutar solo en BD ya existente)
-- ================================================================
-- Agregar columna manual_bonus_pts si la tabla pollas ya existe:
-- alter table public.pollas add column if not exists manual_bonus_pts jsonb not null default '{}';

-- Agregar política de update para admin si no existe:
-- create policy "polla_update_admin"
--   on public.pollas for update to authenticated
--   using  ((select is_admin from public.profiles where id = auth.uid()))
--   with check ((select is_admin from public.profiles where id = auth.uid()));

-- ================================================================
--  MIGRACIÓN: Control de rondas eliminatorias por ronda
--  Ejecutar en Supabase Dashboard → SQL Editor
-- ================================================================
-- 1. Columna para que el admin controle qué rondas están abiertas:
-- alter table public.official_results
--   add column if not exists bracket_rounds_open jsonb not null default '{}';

-- 2. Columna para que cada usuario bloquee sus predicciones por ronda:
-- alter table public.pollas
--   add column if not exists bracket_rounds_locked jsonb not null default '{}';
