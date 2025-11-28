-- Permitir que los usuarios actualicen únicamente sus propias transacciones
drop policy if exists "Users can update own transactions" on transacciones;
create policy "Users can update own transactions"
  on transacciones
  for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);
