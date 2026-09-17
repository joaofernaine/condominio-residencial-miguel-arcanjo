-- Financeiro: síndica passa a poder editar o valor de cada fundo
-- diretamente (clica no card, digita, salva), em vez do total ser só
-- um SUM() derivado da importação de PDF. `fundos_saldo` guarda um
-- valor por fundo por condomínio; a importação de PDF continua
-- funcionando, mas agora INCREMENTA esse saldo (via
-- incrementar_fundo_saldo) em vez de recalcular do zero — assim edição
-- manual e importação convivem sem uma apagar a outra.
--
-- Os totais antigos eram expostos via função SECURITY DEFINER
-- (fundo_obras_total etc.) pra não dar acesso de leitura à tabela crua
-- de importação. `fundos_saldo` não tem esse problema (não guarda valor
-- por unidade), então é lida direto via RLS normal.

create table public.fundos_saldo (
  condominio_id uuid not null references public.condominios(id) on delete cascade,
  fundo text not null check (fundo in ('reserva', 'obras', 'casa_zelador')),
  valor numeric(10, 2) not null default 0,
  atualizado_por uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (condominio_id, fundo)
);

alter table public.fundos_saldo enable row level security;

create policy fundos_saldo_select on public.fundos_saldo
  for select using (condominio_id = (select condominio_id from current_profile()));

create policy fundos_saldo_write on public.fundos_saldo
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

comment on table public.fundos_saldo is
  'Saldo atual de cada fundo (reserva/obras/casa_zelador) por condomínio. Editável direto pela síndica e incrementado pela importação de PDF — fonte única exibida no Financeiro.';

-- SECURITY INVOKER de propósito: a permissão de escrever é a mesma RLS
-- de fundos_saldo_write acima (quem importa PDF já precisa dela).
create or replace function public.incrementar_fundo_saldo(p_condominio_id uuid, p_fundo text, p_delta numeric)
returns void
language sql
security invoker
set search_path to 'public'
as $function$
  insert into public.fundos_saldo (condominio_id, fundo, valor, atualizado_por)
  values (p_condominio_id, p_fundo, p_delta, (select profile_id from current_profile()))
  on conflict (condominio_id, fundo)
  do update set
    valor = public.fundos_saldo.valor + excluded.valor,
    updated_at = now(),
    atualizado_por = excluded.atualizado_por;
$function$;

comment on function public.incrementar_fundo_saldo is
  'Soma p_delta ao saldo atual do fundo (usado pela importação de PDF). Roda como o próprio usuário (security invoker) — precisa da mesma permissão de escrita de fundos_saldo.';

drop function if exists public.fundo_obras_total(uuid);
drop function if exists public.fundo_reserva_total(uuid);
drop function if exists public.fundo_casa_zelador_total(uuid);
