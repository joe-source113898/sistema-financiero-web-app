-- Permite que cada usuario elimine sus propias transacciones (necesario para el reseteo)
alter table transacciones enable row level security;

drop policy if exists "Users can delete own transactions" on transacciones;
create policy "Users can delete own transactions"
  on transacciones
  for delete
  using (auth.uid() = usuario_id);
