-- Admin_agencia pediu a opção de excluir um perfil síndica pela tela (ex.:
-- contas de teste promovidas por engano, ou uma síndica que saiu). Antes,
-- profiles_delete só permitia apagar role='morador', não importa quem
-- chamasse — então mesmo escondendo/mostrando botão no front, o delete de
-- uma síndica sempre seria rejeitado pela RLS (0 linhas afetadas, sem erro).
--
-- Mantém as mesmas garantias de sempre: só admin_agencia (nunca a própria
-- sindica, nunca via permissão granular) pode apagar um perfil síndica —
-- espelha a mesma restrição que já existe pra promover alguém a síndica
-- (prevent_role_escalation). admin_agencia continua impossível de apagar
-- por qualquer um, inclusive por si mesma.

drop policy profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (
        role = 'morador'
        and (
          (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
          or has_permissao('excluir_morador')
        )
      )
      or (
        role = 'sindica'
        and (select role from current_profile()) = 'admin_agencia'
      )
    )
  );
