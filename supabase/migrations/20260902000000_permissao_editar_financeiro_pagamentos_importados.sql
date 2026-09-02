-- A tabela pagamentos_importados foi criada em 20260818220000, antes do
-- sistema de permissões granulares (20260831010000), e ficou de fora
-- daquela migration — RLS ainda só liberava sindica/admin_agencia. Isso
-- deixava o botão "Importar relatório financeiro" quebrado (RLS nega em
-- silêncio) para qualquer morador/funcionário com a permissão
-- "editar_financeiro" concedida via profile_permissoes, mesmo já podendo
-- editar historico_financeiro diretamente.

drop policy pagamentos_importados_select on public.pagamentos_importados;
create policy pagamentos_importados_select on public.pagamentos_importados
  for select using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('editar_financeiro')
    )
  );

drop policy pagamentos_importados_insert on public.pagamentos_importados;
create policy pagamentos_importados_insert on public.pagamentos_importados
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('editar_financeiro')
    )
  );
