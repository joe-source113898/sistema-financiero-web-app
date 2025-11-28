-- Tabla de objetivos
create table if not exists objetivos_ahorro (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id),
  nombre text not null,
  meta numeric(10,2),
  descripcion text,
  color text,
  icono text,
  created_at timestamp default now()
);

create index if not exists idx_objetivos_usuario on objetivos_ahorro(usuario_id);

alter table objetivos_ahorro enable row level security;

drop policy if exists "Users can view objetivos" on objetivos_ahorro;
create policy "Users can view objetivos"
  on objetivos_ahorro
  for select
  using (auth.uid() = usuario_id);

drop policy if exists "Users can manage objetivos" on objetivos_ahorro;
create policy "Users can manage objetivos"
  on objetivos_ahorro
  for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- Columna objetivo_id en transacciones
alter table transacciones
  add column if not exists objetivo_id uuid references objetivos_ahorro(id);

create index if not exists idx_transacciones_objetivo on transacciones(objetivo_id);

-- Cuenta opcional para gastos recurrentes
alter table gastos_mensuales
  add column if not exists cuenta text;
