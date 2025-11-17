-- Tabla de objetivos de ahorro
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

-- Core table for every transaction (ingresos, gastos, ahorro/inversión)
create table if not exists transacciones (
  id uuid primary key default gen_random_uuid(),
  fecha timestamp not null default now(),
  tipo text check (tipo in ('ingreso', 'gasto')) not null,
  monto numeric(10, 2) not null check (monto > 0),
  categoria text not null,
  concepto text default 'Transacción manual',
  descripcion text,
  metodo_pago text check (metodo_pago in ('Efectivo', 'Tarjeta', 'Transferencia')),
  registrado_por text,
  foto_url text,
  objetivo_id uuid references objetivos_ahorro(id),
  usuario_id uuid references auth.users(id),
  created_at timestamp default now()
);

create index if not exists idx_transacciones_fecha on transacciones(fecha desc);
create index if not exists idx_transacciones_tipo on transacciones(tipo);
create index if not exists idx_transacciones_usuario on transacciones(usuario_id);

alter table transacciones
  add column if not exists objetivo_id uuid references objetivos_ahorro(id);

create index if not exists idx_transacciones_objetivo on transacciones(objetivo_id);

alter table transacciones enable row level security;

drop policy if exists "Users can view own transactions" on transacciones;
create policy "Users can view own transactions"
  on transacciones
  for select
  using (auth.uid() = usuario_id);

drop policy if exists "Users can insert own transactions" on transacciones;
create policy "Users can insert own transactions"
  on transacciones
  for insert
  with check (auth.uid() = usuario_id);

-- Table used by the gastos recurrentes feature
create table if not exists gastos_mensuales (
  id uuid primary key default gen_random_uuid(),
  nombre_app text not null,
  dia_de_cobro smallint not null check (dia_de_cobro between 1 and 31),
  monto numeric(10, 2) not null check (monto > 0),
  activo boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists idx_gastos_mensuales_dia
  on gastos_mensuales (dia_de_cobro, activo);

alter table gastos_mensuales enable row level security;

drop policy if exists "Users can view gastos mensuales" on gastos_mensuales;
create policy "Users can view gastos mensuales"
  on gastos_mensuales
  for select
  using (true);

drop policy if exists "Users can manage gastos mensuales" on gastos_mensuales;
create policy "Users can manage gastos mensuales"
  on gastos_mensuales
  for all
  using (true)
  with check (true);
