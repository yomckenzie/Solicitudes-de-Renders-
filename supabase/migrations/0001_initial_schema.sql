-- =====================================================================
-- CornerMaster — schema inicial
-- Pegar en Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- 1. EXTENSIONES --------------------------------------------------------
create extension if not exists "pgcrypto";

-- 2. ENUMS --------------------------------------------------------------
do $$ begin
  create type marca_enum as enum ('JC', 'JCX', 'CK', 'JCB');
exception when duplicate_object then null; end $$;

do $$ begin
  create type categoria_enum as enum ('Casual', 'Interior');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_enum as enum (
    'actualizado',
    'pendiente',
    'requiere_inversion',
    'sin_mobiliario',
    'en_mantenimiento'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type role_enum as enum ('superadmin', 'gerente', 'proyectos', 'supervisor');
exception when duplicate_object then null; end $$;

-- 3. TABLAS -------------------------------------------------------------

-- Perfil de usuario (extiende auth.users con rol y nombre)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role role_enum not null default 'supervisor',
  created_at timestamptz not null default now()
);

-- Malls
create table if not exists public.malls (
  id text primary key,                 -- ej. MALL-001
  nombre text not null,
  ciudad text not null,
  created_at timestamptz not null default now()
);

-- Tiendas (departamentos / grandes almacenes)
create table if not exists public.tiendas (
  id text primary key,                 -- ej. TIEN-001
  mall_id text not null references public.malls(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tiendas_mall on public.tiendas(mall_id);

-- Corners
create table if not exists public.corners (
  id uuid primary key default gen_random_uuid(),
  corner_id text not null unique,      -- código legible CRN-XXXXXX
  mall_id text not null references public.malls(id) on delete restrict,
  tienda_id text not null references public.tiendas(id) on delete restrict,
  marca marca_enum not null,
  categoria categoria_enum not null,
  estado estado_enum not null default 'pendiente',
  fecha_ultima_actualizacion date not null default current_date,
  responsable text,
  notas text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_corners_mall    on public.corners(mall_id);
create index if not exists idx_corners_tienda  on public.corners(tienda_id);
create index if not exists idx_corners_marca   on public.corners(marca);
create index if not exists idx_corners_estado  on public.corners(estado);
create index if not exists idx_corners_fecha   on public.corners(fecha_ultima_actualizacion desc);

-- Fotos
create table if not exists public.corner_fotos (
  id uuid primary key default gen_random_uuid(),
  corner_id uuid not null references public.corners(id) on delete cascade,
  url text not null,
  thumbnail_url text,
  fecha date not null default current_date,
  subido_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_fotos_corner on public.corner_fotos(corner_id, fecha desc);

-- Audit log
create table if not exists public.corner_audit (
  id uuid primary key default gen_random_uuid(),
  corner_id uuid not null references public.corners(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  accion text not null,                -- 'creado' | 'estado_cambiado' | 'editado' | 'foto_subida'
  estado_anterior estado_enum,
  estado_nuevo estado_enum,
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_corner on public.corner_audit(corner_id, created_at desc);

-- 4. TRIGGER: updated_at automático --------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_corners_updated_at on public.corners;
create trigger trg_corners_updated_at
  before update on public.corners
  for each row execute function public.set_updated_at();

-- 5. TRIGGER: crear profile al registrarse ------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. ROW LEVEL SECURITY -------------------------------------------------

alter table public.profiles    enable row level security;
alter table public.malls       enable row level security;
alter table public.tiendas     enable row level security;
alter table public.corners     enable row level security;
alter table public.corner_fotos enable row level security;
alter table public.corner_audit enable row level security;

-- Helper: rol del usuario actual
-- SECURITY DEFINER + STABLE: el plan de query puede cachearlo.
-- (select auth.uid()) en policies envuelve la llamada a esta función con un
-- InitPlan, que Postgres solo evalúa UNA vez por query en vez de por policy.
create or replace function public.current_role()
returns role_enum
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- PROFILES ---------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

-- Users pueden editar solo su propio full_name. El role SOLO lo cambia superadmin.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.current_role() = 'superadmin')
  with check (public.current_role() = 'superadmin');

-- Trigger: si el updater no es superadmin, forzar role al valor previo.
-- Esto evita escalación de privilegios aún si la policy se rompe por error.
create or replace function public.prevent_role_escalation()
returns trigger as $$
begin
  if (public.current_role() is distinct from 'superadmin') then
    new.role = old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- MALLS / TIENDAS: lectura para todos los autenticados, escritura para superadmin/gerente
drop policy if exists "malls_read"     on public.malls;
drop policy if exists "malls_admin"    on public.malls;
drop policy if exists "tiendas_read"   on public.tiendas;
drop policy if exists "tiendas_admin"  on public.tiendas;

create policy "malls_read"  on public.malls  for select to authenticated using (true);
create policy "malls_admin" on public.malls  for all    to authenticated
  using (public.current_role() in ('superadmin', 'gerente'))
  with check (public.current_role() in ('superadmin', 'gerente'));

create policy "tiendas_read"  on public.tiendas for select to authenticated using (true);
create policy "tiendas_admin" on public.tiendas for all    to authenticated
  using (public.current_role() in ('superadmin', 'gerente'))
  with check (public.current_role() in ('superadmin', 'gerente'));

-- CORNERS: lectura para todos, escritura por roles
drop policy if exists "corners_read"     on public.corners;
drop policy if exists "corners_insert"   on public.corners;
drop policy if exists "corners_update"   on public.corners;
drop policy if exists "corners_delete"   on public.corners;

create policy "corners_read" on public.corners
  for select to authenticated using (true);

create policy "corners_insert" on public.corners
  for insert to authenticated
  with check (public.current_role() in ('superadmin', 'gerente', 'proyectos', 'supervisor'));

create policy "corners_update" on public.corners
  for update to authenticated
  using (public.current_role() in ('superadmin', 'gerente', 'proyectos', 'supervisor'))
  with check (public.current_role() in ('superadmin', 'gerente', 'proyectos', 'supervisor'));

create policy "corners_delete" on public.corners
  for delete to authenticated
  using (public.current_role() in ('superadmin', 'gerente'));

-- FOTOS: lectura para todos, escritura por roles operativos
drop policy if exists "fotos_read"   on public.corner_fotos;
drop policy if exists "fotos_write"  on public.corner_fotos;
drop policy if exists "fotos_delete" on public.corner_fotos;

create policy "fotos_read" on public.corner_fotos
  for select to authenticated using (true);

create policy "fotos_write" on public.corner_fotos
  for insert to authenticated
  with check (public.current_role() in ('superadmin', 'gerente', 'proyectos', 'supervisor'));

create policy "fotos_delete" on public.corner_fotos
  for delete to authenticated
  using (public.current_role() in ('superadmin', 'gerente') or subido_por = (select auth.uid()));

-- AUDIT: append-only para todos los autenticados
drop policy if exists "audit_read"  on public.corner_audit;
drop policy if exists "audit_write" on public.corner_audit;
drop policy if exists "audit_delete" on public.corner_audit;

create policy "audit_read" on public.corner_audit
  for select to authenticated using (true);

create policy "audit_write" on public.corner_audit
  for insert to authenticated
  with check (public.current_role() in ('superadmin', 'gerente', 'proyectos', 'supervisor'));

create policy "audit_delete" on public.corner_audit
  for delete to authenticated
  using (public.current_role() = 'superadmin');

-- 7. STORAGE: bucket para fotos ----------------------------------------
insert into storage.buckets (id, name, public)
values ('corner-fotos', 'corner-fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos_storage_read"   on storage.objects;
drop policy if exists "fotos_storage_write"  on storage.objects;
drop policy if exists "fotos_storage_delete" on storage.objects;

create policy "fotos_storage_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'corner-fotos');

create policy "fotos_storage_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'corner-fotos');

create policy "fotos_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'corner-fotos' and (public.current_role() in ('superadmin','gerente') or owner = (select auth.uid())));

-- 8. TRIGGER: auditar cambios de estado --------------------------------
create or replace function public.audit_corner_state()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.corner_audit (corner_id, user_id, accion, estado_nuevo, notas)
    values (new.id, auth.uid(), 'creado', new.estado, new.notas);
    return new;
  elsif (tg_op = 'UPDATE' and old.estado is distinct from new.estado) then
    insert into public.corner_audit (corner_id, user_id, accion, estado_anterior, estado_nuevo, notas)
    values (new.id, auth.uid(), 'estado_cambiado', old.estado, new.estado, new.notas);
    return new;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_audit_corner on public.corners;
create trigger trg_audit_corner
  after insert or update on public.corners
  for each row execute function public.audit_corner_state();

-- =====================================================================
-- FIN schema. La sección de seed (malls/tiendas/corners de ejemplo) está
-- en supabase/seed/001_seed.sql
-- =====================================================================
