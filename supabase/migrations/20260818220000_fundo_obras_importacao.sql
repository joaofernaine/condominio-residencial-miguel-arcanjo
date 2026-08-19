-- Fundo de Obras: importação do relatório mensal de cobranças pagas
-- (PDF que a administradora envia). Guarda cada cobrança importada
-- (deduplicada por nosso_numero) e permite somar o total de Fundo de
-- Obras arrecadado sem expor valores individuais aos moradores --
-- eles só veem o total agregado via a função `fundo_obras_total()`,
-- nunca a tabela em si.
--
-- `profiles.codigo_relatorio_externo` guarda o código de unidade do
-- relatório (ex. "101B") depois que a síndica confirma o match uma
-- vez, pra próximas importações já virem casadas automaticamente.

alter table public.profiles
  add column codigo_relatorio_externo text;

comment on column public.profiles.codigo_relatorio_externo is
  'Código de unidade usado no relatório de cobranças da administradora (ex. "101B"), salvo após a síndica confirmar o match na importação. Usado para auto-casar em importações futuras.';

create table public.pagamentos_importados (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references public.condominios(id) on delete cascade,
  unidade_id uuid not null references public.profiles(id) on delete cascade,
  competencia_ano integer not null,
  competencia_mes integer not null check (competencia_mes between 1 and 12),
  nosso_numero text not null,
  valor_taxa_condominio numeric(10, 2) not null default 0,
  valor_fundo_reserva numeric(10, 2) not null default 0,
  valor_fundo_obras numeric(10, 2) not null default 0,
  valor_outros numeric(10, 2) not null default 0,
  data_credito date,
  importado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (condominio_id, nosso_numero)
);

alter table public.pagamentos_importados enable row level security;

create policy pagamentos_importados_select on public.pagamentos_importados
  for select using (
    condominio_id = (select condominio_id from current_profile())
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  );

create policy pagamentos_importados_insert on public.pagamentos_importados
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and (select role from current_profile()) = any (array['sindica', 'admin_agencia'])
  );

comment on table public.pagamentos_importados is
  'Cobranças importadas do relatório em PDF da administradora, deduplicadas por nosso_numero. Só síndica/admin_agencia leem a tabela crua; moradores veem apenas o total via fundo_obras_total().';

-- Total de Fundo de Obras arrecadado, exposto pra qualquer morador do
-- próprio condomínio sem dar acesso de leitura à tabela crua (que tem
-- valor por unidade).
create or replace function public.fundo_obras_total(p_condominio_id uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(sum(valor_fundo_obras), 0)
  from public.pagamentos_importados
  where condominio_id = p_condominio_id
    and condominio_id = (select condominio_id from current_profile());
$function$;

comment on function public.fundo_obras_total is
  'Soma o Fundo de Obras arrecadado (todas as importações) para o condomínio do usuário logado. SECURITY DEFINER para permitir que moradores vejam o total sem ler pagamentos_importados diretamente.';
