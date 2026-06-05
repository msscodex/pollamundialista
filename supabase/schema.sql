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
  id         uuid    primary key default gen_random_uuid(),
  user_id    uuid    references public.profiles(id) on delete cascade not null unique,
  scores     jsonb   not null default '{}',
  bracket    jsonb   not null default '{}',
  bonuses    jsonb   not null default '{}',
  updated_at timestamptz not null default now()
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
  on public.profiles for select to authenticated using (true);

create policy "perfil_update_propio"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- POLLAS ----
create policy "pollas_select"
  on public.pollas for select to authenticated using (true);

create policy "polla_insert_propia"
  on public.pollas for insert to authenticated
  with check (auth.uid() = user_id);

create policy "polla_update_propia"
  on public.pollas for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- OFFICIAL RESULTS ----
create policy "resultados_select"
  on public.official_results for select to authenticated using (true);

create policy "resultados_insert_admin"
  on public.official_results for insert to authenticated
  with check ((select is_admin from public.profiles where id = auth.uid()));

create policy "resultados_update_admin"
  on public.official_results for update to authenticated
  using  ((select is_admin from public.profiles where id = auth.uid()))
  with check ((select is_admin from public.profiles where id = auth.uid()));

-- ================================================================
--  CREAR PRIMER ADMIN
--  Después de crear el usuario vía Supabase Dashboard → Authentication,
--  ejecuta esto reemplazando el email:
-- ================================================================
-- update public.profiles
-- set is_admin = true
-- where id = (select id from auth.users where email = 'tu@email.com');
