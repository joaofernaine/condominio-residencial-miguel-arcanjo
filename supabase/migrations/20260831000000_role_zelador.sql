-- Novo papel "zelador" (funcionário): só enxerga e aprova/recusa
-- visitantes e reservas (hoje só existe a Churrasqueira como espaço
-- reservável), sem acesso a financeiro, obras, votações, classificados,
-- documentos, avisos ou gestão de moradores. Aplicado direto via MCP do
-- Supabase em 2026-08-31 (QA fqgmmmxxqzopcwbsdqgk primeiro, depois
-- produção kccgazitxagxcbsuuiwn) — este arquivo só documenta/versiona o
-- que já foi aplicado, seguindo a recomendação da auditoria de segurança
-- de trazer toda RLS pra dentro de supabase/migrations/.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['morador', 'sindica', 'admin_agencia', 'zelador']));

-- zelador precisa ler nome/unidade do morador dono do visitante/reserva
-- que está aprovando (join feito pelo PostgREST respeita RLS da tabela
-- embutida) — sem isso ele veria o visitante/reserva "sem dono".
drop policy profiles_select_condominio on public.profiles;
create policy profiles_select_condominio on public.profiles
  for select using (
    condominio_id = (select condominio_id from current_profile())
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
  );

drop policy visitantes_select on public.visitantes;
create policy visitantes_select on public.visitantes
  for select using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
    )
  );

drop policy visitantes_update on public.visitantes;
create policy visitantes_update on public.visitantes
  for update using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
    )
  );

drop policy reservas_update on public.reservas;
create policy reservas_update on public.reservas
  for update using (
    condominio_id = (select condominio_id from current_profile())
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
  );

-- Bug encontrado à parte (não existia NENHUMA policy de DELETE em
-- `reservas`): o botão "Remover bloqueio" da síndica não apagava nada de
-- verdade, a RLS bloqueava silenciosamente. zelador não entra aqui —
-- só aprova/recusa, não apaga.
create policy reservas_delete on public.reservas
  for delete using (
    condominio_id = (select condominio_id from current_profile())
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  );
