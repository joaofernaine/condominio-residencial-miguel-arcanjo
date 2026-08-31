-- Sistema de permissões granulares: uma pessoa pode manter seu papel base
-- (ex.: "morador") e ACUMULAR permissões extras específicas (ex.:
-- "aprovar_visitantes", "gerenciar_obras") — vira uma "Subsíndica/Morador"
-- em vez de virar admin_agencia/sindica de verdade. Aplicado direto via
-- MCP do Supabase em 2026-08-31 (QA fqgmmmxxqzopcwbsdqgk primeiro, depois
-- produção kccgazitxagxcbsuuiwn) — este arquivo documenta/versiona o que
-- já foi aplicado.
--
-- Só sindica/admin_agencia (papel base) podem conceder/revogar permissões
-- de terceiros (profile_permissoes_write). Promover alguém a sindica ou
-- admin_agencia de verdade continua exclusivo de admin_agencia — reforçado
-- por trigger (prevent_role_escalation), não só pela RLS de UPDATE, porque
-- profiles_update_admin agora também libera quem tem 'gerenciar_moradores'
-- e o trigger impede esse alguém de escalar o próprio role ou o de outros.

alter table public.profiles add column if not exists titulo_funcao text;

create table public.profile_permissoes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permissao text not null check (permissao = any (array[
    'ver_financeiro', 'editar_financeiro', 'gerenciar_moradores', 'excluir_morador',
    'gerenciar_obras', 'gerenciar_votacoes', 'publicar_avisos', 'moderar_classificados',
    'responder_chamados', 'aprovar_visitantes', 'aprovar_reservas', 'cadastrar_funcionario'
  ])),
  created_at timestamptz not null default now(),
  unique (profile_id, permissao)
);
alter table public.profile_permissoes enable row level security;

create or replace function public.has_permissao(p_permissao text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.profile_permissoes pp
    where pp.profile_id = (select profile_id from current_profile())
    and pp.permissao = p_permissao
  );
$$;

create or replace function public.tem_alguma_permissao()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.profile_permissoes pp
    where pp.profile_id = (select profile_id from current_profile())
  );
$$;

create policy profile_permissoes_select on public.profile_permissoes
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_permissoes.profile_id
      and p.condominio_id = (select condominio_id from current_profile())
    )
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  );

create policy profile_permissoes_write on public.profile_permissoes
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_permissoes.profile_id
      and p.condominio_id = (select condominio_id from current_profile())
    )
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = profile_permissoes.profile_id
      and p.condominio_id = (select condominio_id from current_profile())
    )
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  );

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.role is distinct from old.role
     and new.role in ('sindica', 'admin_agencia')
     and (select role from current_profile()) <> 'admin_agencia' then
    raise exception 'Somente admin_agencia pode promover a sindica/admin_agencia.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

-- profiles: quem tem qualquer permissão consegue ver nome/unidade do
-- condomínio (precisa pra saber de quem é o chamado/visitante/reserva que
-- está tratando); gerenciar_moradores libera editar; excluir_morador
-- libera apagar (role do alvo continua restrito a 'morador').
drop policy profiles_select_condominio on public.profiles;
create policy profiles_select_condominio on public.profiles
  for select using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
      or tem_alguma_permissao()
    )
  );

drop policy profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('gerenciar_moradores')
    )
  );

drop policy profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (
    role = 'morador'
    and condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('excluir_morador')
    )
  );

-- financeiro
drop policy financeiro_select on public.historico_financeiro;
create policy financeiro_select on public.historico_financeiro
  for select using (
    (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      and condominio_id = (select condominio_id from current_profile())
    )
    or unidade_id = (select profile_id from current_profile())
    or (has_permissao('ver_financeiro') and condominio_id = (select condominio_id from current_profile()))
  );

drop policy financeiro_write on public.historico_financeiro;
create policy financeiro_write on public.historico_financeiro
  for all using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('editar_financeiro')
    )
  )
  with check (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('editar_financeiro')
    )
  );

-- obras
drop policy obras_write on public.obras;
create policy obras_write on public.obras
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('gerenciar_obras')
    )
  );

drop policy obras_update on public.obras;
create policy obras_update on public.obras
  for update using (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('gerenciar_obras')
  );

drop policy obras_delete on public.obras;
create policy obras_delete on public.obras
  for delete using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('gerenciar_obras')
    )
  );

drop policy obra_atualizacoes_write on public.obra_atualizacoes;
create policy obra_atualizacoes_write on public.obra_atualizacoes
  for insert with check (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('gerenciar_obras')
  );

drop policy obra_atualizacoes_delete on public.obra_atualizacoes;
create policy obra_atualizacoes_delete on public.obra_atualizacoes
  for delete using (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('gerenciar_obras')
  );

-- pautas / votos
drop policy pautas_write on public.pautas;
create policy pautas_write on public.pautas
  for all using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('gerenciar_votacoes')
    )
  )
  with check (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('gerenciar_votacoes')
    )
  );

drop policy leitura_votos on public.votos;
create policy leitura_votos on public.votos
  for select using (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('gerenciar_votacoes')
  );

-- avisos / amenidades / config da landing
drop policy avisos_write on public.avisos_publicos;
create policy avisos_write on public.avisos_publicos
  for all using (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('publicar_avisos')
  )
  with check (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('publicar_avisos')
  );

drop policy amenidades_write on public.amenidades;
create policy amenidades_write on public.amenidades
  for all using (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('publicar_avisos')
  )
  with check (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('publicar_avisos')
  );

drop policy config_write on public.condominio_config;
create policy config_write on public.condominio_config
  for all using (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('publicar_avisos')
  )
  with check (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('publicar_avisos')
  );

-- classificados (moderação)
drop policy classificados_update on public.classificados;
create policy classificados_update on public.classificados
  for update using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('moderar_classificados')
    )
  );

drop policy classificados_delete on public.classificados;
create policy classificados_delete on public.classificados
  for delete using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('moderar_classificados')
    )
  );

-- chamados (responder/fechar)
drop policy chamados_update on public.chamados;
create policy chamados_update on public.chamados
  for update using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('responder_chamados')
    )
  );

drop policy chamados_delete on public.chamados;
create policy chamados_delete on public.chamados
  for delete using (
    (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
    or has_permissao('responder_chamados')
  );

drop policy chamados_select on public.chamados;
create policy chamados_select on public.chamados
  for select using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      or has_permissao('responder_chamados')
    )
  );

-- visitantes / reservas: soma a permissão granular, mantendo o role
-- "zelador" (já existente desde a migration anterior) funcionando igual
drop policy visitantes_select on public.visitantes;
create policy visitantes_select on public.visitantes
  for select using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
      or has_permissao('aprovar_visitantes')
    )
  );

drop policy visitantes_update on public.visitantes;
create policy visitantes_update on public.visitantes
  for update using (
    condominio_id = (select condominio_id from current_profile())
    and (
      morador_id = (select profile_id from current_profile())
      or (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
      or has_permissao('aprovar_visitantes')
    )
  );

drop policy reservas_update on public.reservas;
create policy reservas_update on public.reservas
  for update using (
    condominio_id = (select condominio_id from current_profile())
    and (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia', 'zelador'])
      or has_permissao('aprovar_reservas')
    )
  );
