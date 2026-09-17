-- Financeiro deixa de mostrar "pagou/não pagou por unidade" e passa a
-- mostrar só o total arrecadado por fundo (Reserva, Obras, Casa do
-- Zelador). Fundo de Obras já tinha total (fundo_obras_total); esta
-- migration adiciona a categoria Casa do Zelador (antes misturada em
-- "Outros" na importação) e o total de Fundo de Reserva (o valor já era
-- importado, só faltava o agregado).

alter table public.pagamentos_importados
  add column valor_casa_zelador numeric(10, 2) not null default 0;

comment on column public.pagamentos_importados.valor_casa_zelador is
  'Valor de "Manut. teto casa zelador" (e afins) do relatório importado — antes ia dentro de valor_outros.';

create or replace function public.fundo_reserva_total(p_condominio_id uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(sum(valor_fundo_reserva), 0)
  from public.pagamentos_importados
  where condominio_id = p_condominio_id
    and condominio_id = (select condominio_id from current_profile());
$function$;

comment on function public.fundo_reserva_total is
  'Soma o Fundo de Reserva arrecadado (todas as importações) para o condomínio do usuário logado. SECURITY DEFINER para permitir que moradores vejam o total sem ler pagamentos_importados diretamente.';

create or replace function public.fundo_casa_zelador_total(p_condominio_id uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(sum(valor_casa_zelador), 0)
  from public.pagamentos_importados
  where condominio_id = p_condominio_id
    and condominio_id = (select condominio_id from current_profile());
$function$;

comment on function public.fundo_casa_zelador_total is
  'Soma o Fundo Casa do Zelador arrecadado (todas as importações) para o condomínio do usuário logado. SECURITY DEFINER para permitir que moradores vejam o total sem ler pagamentos_importados diretamente.';
