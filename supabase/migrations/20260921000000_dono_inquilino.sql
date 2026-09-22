-- Sistema dono/inquilino: toda unidade nasce com o morador cadastrado como
-- "dono" (default). A síndica/admin_agencia pode cadastrar um segundo
-- perfil como "inquilino" vinculado à mesma unidade (mesmo condominio_id +
-- unidade). No máximo 1 dono e 1 inquilino por unidade real.
--
-- Por padrão o inquilino tem acesso igual a um morador comum (nada muda —
-- é o que já acontecia antes dessa migration). O dono decide, área por
-- área (votação/financeiro/obras/reservas/marketplace/visitantes/fale com
-- síndica), o que quer RESTRINGIR pro inquilino da própria unidade —
-- bloquear é ação explícita, registrada em `unidade_areas_bloqueadas`.
-- Um perfil "dono" nunca pode ter linha nessa tabela (trigger abaixo),
-- então `area_liberada()` sempre retorna true pra dono/síndica/admin_agencia.
--
-- Escopo das áreas gateadas por enquanto: só as ações de ESCRITA que hoje
-- são amarradas ao próprio profile_id (votar, reservar, postar
-- classificado, cadastrar visitante, abrir chamado) + a LEITURA de
-- historico_financeiro/obras (dados por unidade, faz sentido esconder por
-- completo). Calendário de reservas/obras-como-lista-pública e o conteúdo
-- das pautas continuam visíveis pra todo mundo do condomínio — só a AÇÃO
-- de participar é que trava.

alter table public.profiles
  add column if not exists tipo_ocupante text not null default 'dono'
  check (tipo_ocupante in ('dono', 'inquilino'));

-- Sem constraint de unicidade por unidade: já existem unidades (ex. B-202)
-- com mais de um perfil "dono" hoje, de antes dessa feature — mantidos como
-- estão de propósito, não corrigidos aqui. Os helpers abaixo (`dono_da_unidade`,
-- `area_liberada`) assumem o caso comum (1 dono), mas não quebram nesses
-- casos legados: só não fazem sentido pra tela do inquilino distinguir qual
-- dos dois é "o" dono.

create table public.unidade_areas_bloqueadas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  area text not null check (area = any (array[
    'votacao', 'financeiro', 'obras', 'reservas', 'marketplace', 'visitantes', 'fale_com_sindica'
  ])),
  created_at timestamptz not null default now(),
  unique (profile_id, area)
);
alter table public.unidade_areas_bloqueadas enable row level security;

create or replace function public.check_bloqueio_eh_inquilino()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.profile_id and tipo_ocupante = 'inquilino'
  ) then
    raise exception 'Só é possível restringir área para um perfil do tipo inquilino.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_bloqueio_eh_inquilino on public.unidade_areas_bloqueadas;
create trigger trg_check_bloqueio_eh_inquilino
before insert or update on public.unidade_areas_bloqueadas
for each row execute function public.check_bloqueio_eh_inquilino();

create or replace function public.area_liberada(p_area text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select not exists (
    select 1 from public.unidade_areas_bloqueadas b
    join public.profiles p on p.id = b.profile_id
    where p.auth_user_id = auth.uid()
    and b.area = p_area
  );
$$;

-- Profile do dono vinculado à mesma unidade do perfil logado (útil quando
-- quem chama é o inquilino: resolve de quem é o histórico financeiro que
-- ele passou a poder ver).
create or replace function public.dono_da_unidade()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select d.id
  from public.profiles me
  join public.profiles d
    on d.unidade = me.unidade
    and d.condominio_id = me.condominio_id
    and d.tipo_ocupante = 'dono'
  where me.auth_user_id = auth.uid()
  limit 1;
$$;

create policy unidade_areas_bloqueadas_select on public.unidade_areas_bloqueadas
  for select using (
    profile_id = (select id from public.profiles where auth_user_id = auth.uid())
    or exists (
      select 1
      from public.profiles inquilino
      join public.profiles eu
        on eu.unidade = inquilino.unidade
        and eu.condominio_id = inquilino.condominio_id
        and eu.tipo_ocupante = 'dono'
      where inquilino.id = unidade_areas_bloqueadas.profile_id
      and eu.auth_user_id = auth.uid()
    )
    or (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  );

create policy unidade_areas_bloqueadas_write on public.unidade_areas_bloqueadas
  for all using (
    exists (
      select 1
      from public.profiles inquilino
      join public.profiles eu
        on eu.unidade = inquilino.unidade
        and eu.condominio_id = inquilino.condominio_id
        and eu.tipo_ocupante = 'dono'
      where inquilino.id = unidade_areas_bloqueadas.profile_id
      and eu.auth_user_id = auth.uid()
    )
    or (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  )
  with check (
    exists (
      select 1
      from public.profiles inquilino
      join public.profiles eu
        on eu.unidade = inquilino.unidade
        and eu.condominio_id = inquilino.condominio_id
        and eu.tipo_ocupante = 'dono'
      where inquilino.id = unidade_areas_bloqueadas.profile_id
      and eu.auth_user_id = auth.uid()
    )
    or (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  );

-- votação: 1 voto por UNIDADE, não por pessoa. Isso não é só dono/inquilino
-- — já existem hoje unidades com 2 perfis reais (ex.: B-202 síndica +
-- cônjuge, B-406 subsíndica + cônjuge), todos com acesso pleno ao resto
-- (financeiro, obras, reservas...). Regra: quem se cadastrou primeiro na
-- unidade mantém o voto; qualquer outro perfil da mesma unidade (cônjuge,
-- inquilino, etc.) mantém tudo, exceto votar.
drop policy votos_insert on public.votos;
create policy votos_insert on public.votos
  for insert with check (
    morador_id = (select id from public.profiles where auth_user_id = auth.uid())
    and area_liberada('votacao')
    and not exists (
      select 1 from public.profiles outro
      where outro.condominio_id = (select condominio_id from public.profiles where auth_user_id = auth.uid())
      and outro.unidade = (select unidade from public.profiles where auth_user_id = auth.uid())
      and outro.created_at < (select created_at from public.profiles where auth_user_id = auth.uid())
    )
  );

-- financeiro: além do próprio (dono), o inquilino liberado enxerga o
-- histórico do dono da mesma unidade.
drop policy financeiro_select on public.historico_financeiro;
create policy financeiro_select on public.historico_financeiro
  for select using (
    (
      (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
      and condominio_id = (select condominio_id from current_profile())
    )
    or (
      area_liberada('financeiro')
      and (
        unidade_id = (select profile_id from current_profile())
        or unidade_id = dono_da_unidade()
      )
    )
    or (has_permissao('ver_financeiro') and condominio_id = (select condominio_id from current_profile()))
  );

-- obras
drop policy obras_select on public.obras;
create policy obras_select on public.obras
  for select using (
    condominio_id = (select profiles.condominio_id from profiles where profiles.auth_user_id = auth.uid())
    and area_liberada('obras')
  );

drop policy obra_atualizacoes_select on public.obra_atualizacoes;
create policy obra_atualizacoes_select on public.obra_atualizacoes
  for select using (
    area_liberada('obras')
    and obra_id in (
      select obras.id from obras
      where obras.condominio_id = (select profiles.condominio_id from profiles where profiles.auth_user_id = auth.uid())
    )
  );

-- reservas: duas policies de INSERT existiam (OR'd) — só uma tinha check de
-- dono do registro. Precisa gatear as duas, senão a mais permissiva
-- (reservas_insert, sem dono) libera geral mesmo com a área bloqueada.
drop policy reservas_insert on public.reservas;
create policy reservas_insert on public.reservas
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and area_liberada('reservas')
  );

drop policy morador_cria_propria_reserva on public.reservas;
create policy morador_cria_propria_reserva on public.reservas
  for insert with check (
    morador_id = (select profile_id from current_profile())
    and area_liberada('reservas')
  );

-- marketplace (classificados)
drop policy classificados_insert on public.classificados;
create policy classificados_insert on public.classificados
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and morador_id = (select profile_id from current_profile())
    and status = 'pendente'
    and area_liberada('marketplace')
  );

-- visitantes
drop policy visitantes_insert on public.visitantes;
create policy visitantes_insert on public.visitantes
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and morador_id = (select profile_id from current_profile())
    and area_liberada('visitantes')
  );

-- fale com síndica (chamados)
drop policy chamados_insert on public.chamados;
create policy chamados_insert on public.chamados
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and morador_id = (select profile_id from current_profile())
    and area_liberada('fale_com_sindica')
  );
