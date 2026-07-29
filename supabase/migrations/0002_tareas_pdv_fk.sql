-- =====================================================================
-- Migración 0002: crear tabla tareas con columna pdvId y FK
-- =====================================================================
-- Esta migración crea la tabla `tareas` (si no existe) y le agrega la
-- columna `pdvId` con FK a `puntos_de_venta(id)`. Reemplaza el SETUP_SQL
-- embebido en la UI de /dashboard/tareas.
-- =====================================================================

-- 1. Crear tabla tareas (idempotente) ----------------------------------
create table if not exists public.tareas (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descripcion text,
  "asignadaA" text not null default 'Yovanni',
  "creadaPor" text not null,
  estado text not null default 'Pendiente'
    check (estado in ('Pendiente', 'En Progreso', 'Completada')),
  prioridad text not null default 'Media'
    check (prioridad in ('Alta', 'Media', 'Baja')),
  "fechaLimite" date,
  "solicitudId" uuid,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- 2. Agregar columna pdvId (idempotente) -------------------------------
alter table public.tareas
  add column if not exists "pdvId" text;

-- 3. Agregar FK a puntos_de_venta(id) (idempotente) -------------------
do $$ begin
  alter table public.tareas
    add constraint tareas_pdv_fkey
    foreign key ("pdvId") references public.puntos_de_venta(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- 4. Índice para joins por pdvId ---------------------------------------
create index if not exists idx_tareas_pdv on public.tareas("pdvId");

-- 5. Trigger updated_at automático -------------------------------------
create or replace function public.set_tareas_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tareas_updated_at on public.tareas;
create trigger trg_tareas_updated_at
  before update on public.tareas
  for each row execute function public.set_tareas_updated_at();

-- =====================================================================
-- FIN migración 0002
-- =====================================================================
