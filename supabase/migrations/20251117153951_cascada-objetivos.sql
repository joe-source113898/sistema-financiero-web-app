-- Agrega la columna cuenta (si aún no existe)
alter table gastos_mensuales
  add column if not exists cuenta text;

-- Asegura que la FK de transacciones -> objetivos elimine en cascada
alter table transacciones
  drop constraint if exists transacciones_objetivo_id_fkey;

alter table transacciones
  add constraint transacciones_objetivo_id_fkey
  foreign key (objetivo_id)
  references objetivos_ahorro(id)
  on delete cascade;
