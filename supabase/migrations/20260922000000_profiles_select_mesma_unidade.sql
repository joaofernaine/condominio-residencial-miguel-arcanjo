-- Fix: dono não conseguia ler o profile do próprio inquilino (nem
-- vice-versa) porque profiles_select_condominio e profiles_select_proprio
-- não cobrem "outro perfil da mesma unidade" — só cobrem staff/permissão ou
-- o próprio registro. Sem isso, InquilinoAcessoCard nunca encontrava o
-- inquilino (RLS filtra a linha silenciosamente, sem erro).
create policy profiles_select_mesma_unidade on public.profiles
  for select using (
    unidade is not null
    and exists (
      select 1 from public.profiles eu
      where eu.auth_user_id = auth.uid()
      and eu.unidade = profiles.unidade
      and eu.condominio_id = profiles.condominio_id
    )
  );
