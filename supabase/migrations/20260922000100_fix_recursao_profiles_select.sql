-- Fix urgente: profiles_select_mesma_unidade (migration anterior) causou
-- "infinite recursion detected in policy for relation profiles" — o
-- subquery correlacionado direto em public.profiles dentro de uma policy
-- da própria public.profiles reavalia a RLS recursivamente. Corrige usando
-- uma função security definer (mesmo padrão de current_profile/has_permissao,
-- que já bypassa RLS de propósito) pra resolver a própria unidade/condominio
-- sem reentrar na policy.
drop policy if exists profiles_select_mesma_unidade on public.profiles;

create or replace function public.minha_unidade()
returns table(unidade text, condominio_id uuid)
language sql
stable
security definer
set search_path to 'public'
as $$
  select unidade, condominio_id from public.profiles where auth_user_id = auth.uid();
$$;

create policy profiles_select_mesma_unidade on public.profiles
  for select using (
    unidade is not null
    and unidade = (select unidade from public.minha_unidade())
    and condominio_id = (select condominio_id from public.minha_unidade())
  );
