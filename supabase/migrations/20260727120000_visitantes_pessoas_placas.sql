-- Cadastro de visitante com lista de pessoas (nome + CPF) e placas.
-- Aditiva e idempotente. O schema deste projeto precede o versionamento de
-- migrations; este arquivo cobre apenas esta mudança.
--
-- pessoas: [{"nome":"Ana Souza","cpf":"123.456.789-09"}, ...], 1 a 8 itens.
-- placas:  ["ABC1D23", ...], 0 a 2 itens.
-- NULL em qualquer uma das duas colunas significa "registro anterior a esta
-- feature" — a leitura deve cair no fallback (nome_visitante/cpf/placa_veiculo).
--
-- Deliberadamente sem CHECK de formato de CPF/placa: há um registro de
-- produção com cpf = '123.123.123-12' (dígito verificador inválido); um CHECK
-- de formato bloquearia qualquer UPDATE futuro nesse registro (aprovar/
-- recusar). Validação de formato fica no cliente.
--
-- Sem backfill dos registros existentes: preencher `pessoas` para eles
-- fabricaria pessoas com cpf null, violando a invariante de CPF obrigatório
-- do formato novo. O fallback de leitura resolve sem esse risco.

alter table public.visitantes
  add column if not exists pessoas jsonb,
  add column if not exists placas  jsonb;

alter table public.visitantes
  drop constraint if exists visitantes_pessoas_shape;
alter table public.visitantes
  add constraint visitantes_pessoas_shape check (
    pessoas is null
    or (
      jsonb_typeof(pessoas) = 'array'
      and jsonb_array_length(pessoas) between 1 and 8
    )
  );

alter table public.visitantes
  drop constraint if exists visitantes_placas_shape;
alter table public.visitantes
  add constraint visitantes_placas_shape check (
    placas is null
    or (
      jsonb_typeof(placas) = 'array'
      and jsonb_array_length(placas) between 0 and 2
    )
  );

comment on column public.visitantes.pessoas is
  'Pessoas que vao entrar: [{"nome":"...","cpf":"000.000.000-00"}], 1 a 8. NULL = registro anterior a esta feature (usar nome_visitante/cpf como fallback).';
comment on column public.visitantes.placas is
  'Placas dos veiculos: ["ABC1D23"], 0 a 2. NULL = registro anterior (usar placa_veiculo como fallback). [] = nenhum carro informado.';
comment on column public.visitantes.nome_visitante is
  'Denormalizado de pessoas[0].nome quando pessoas esta presente. Mantido para compatibilidade.';
comment on column public.visitantes.acompanhantes is
  'Denormalizado: pessoas.length - 1 quando pessoas esta presente. Mantido para compatibilidade.';
