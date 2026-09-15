-- Bug: quem tinha permissão granular concedida (ex.: Zelador com
-- aprovar_visitantes/aprovar_reservas) via "Gerenciar função" via
-- exatamente a mesma tela de um morador comum. Causa: a policy de SELECT
-- em profile_permissoes só liberava sindica/admin_agencia lerem a
-- tabela — a própria pessoa não conseguia ler as permissões que ela
-- mesma tinha recebido. O join embutido do PostgREST em
-- `profiles.select("*, profile_permissoes(permissao)")` voltava vazio
-- pra ela, então profile.permissoes.length === 0 e o front caía no
-- ResidentDashboard. As permissões continuavam funcionando no banco
-- (RLS de visitantes/reservas usa has_permissao(), que é security
-- definer e não depende dessa policy) — só não apareciam na tela.
-- Aplicado direto via MCP do Supabase em 2026-09-15 (QA
-- fqgmmmxxqzopcwbsdqgk primeiro, depois produção kccgazitxagxcbsuuiwn)
-- — este arquivo só documenta/versiona o que já foi aplicado.

drop policy profile_permissoes_select on public.profile_permissoes;
create policy profile_permissoes_select on public.profile_permissoes
  for select using (
    profile_id = (select profile_id from current_profile())
    or (
      exists (
        select 1 from public.profiles p
        where p.id = profile_permissoes.profile_id
        and p.condominio_id = (select condominio_id from current_profile())
      )
      and (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    )
  );
