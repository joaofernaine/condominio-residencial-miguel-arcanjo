-- Morador pode cancelar (excluir) a própria reserva, além de
-- sindica/admin_agencia/zelador/quem tem 'aprovar_reservas' via
-- reservas_delete (essa outra policy já existia). Aplicado direto via
-- MCP do Supabase em 2026-08-31 (QA primeiro, depois produção).
create policy reservas_delete_proprio on public.reservas
  for delete using (
    morador_id = (select profile_id from current_profile())
  );
