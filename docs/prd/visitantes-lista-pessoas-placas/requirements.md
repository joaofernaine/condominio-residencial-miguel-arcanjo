# Requirements — visitantes-lista-pessoas-placas

## Contexto

O formulário "Cadastrar visitante" do morador (`visitantes-resident-section.tsx`)
captura hoje **uma pessoa só**: um nome, um CPF opcional e uma placa. Para
locação temporária (Airbnb) existe apenas um contador `acompanhantes` — um
número solto, sem os nomes nem os CPFs de quem realmente vai entrar. A síndica
pediu que a portaria receba a identificação de cada pessoa e de cada veículo.

A síndica aprovou o modelo visual atual do card/dialog; o pedido é sobre o
conteúdo capturado, não sobre redesenhar a tela.

Decisão de modelagem: quantidade de carros é um campo próprio do usuário, e
não derivada de "1 placa a cada N pessoas" — 5 pessoas podem vir em 2 carros
(2 num, 3 no outro), então a razão pessoas/carros não é fixa.

Ver design completo em `C:\Users\Computador João\.claude\plans\temos-que-mudar-a-linked-bengio.md`.

## Perguntas em aberto

Nenhuma. Decisões fechadas com o usuário via AskUserQuestion:

- Escopo: lista dinâmica vale para os dois tipos (Visita e Airbnb), não só Airbnb.
- Pessoas: de 1 a 8, nome + CPF de cada uma.
- CPF: obrigatório para todas as pessoas (inclui validação de dígito
  verificador, não só máscara — decisão do implementador, sinalizada ao
  usuário como reversível se ele preferir só máscara).
- Carros: de 0 a 2 (0 permitido — visita a pé/Uber/ônibus).
- Placa: validada, aceitando formato Mercosul (`ABC1D23`) e antigo (`ABC1234`);
  usuário concordou que é aceitável começar restrito e afrouxar depois se
  houver reclamação de formato não coberto.
- Datas de entrada/saída continuam embaixo da lista, como hoje.
- Armazenamento: colunas JSON na tabela `visitantes` existente, sem criar
  tabelas novas — os 4 registros já existentes em produção precisam continuar
  funcionando sem migração de dados.

## Requisitos

### Banco de dados

- [ ] Migration `supabase/migrations/20260727120000_visitantes_pessoas_placas.sql`
  adiciona `pessoas jsonb` (nullable, sem default) e `placas jsonb` (nullable,
  sem default) à tabela `visitantes`, com CHECK constraints validando a forma
  (`pessoas`: array de 1 a 8 itens quando não-nulo; `placas`: array de 0 a 2
  itens quando não-nulo). Sem CHECK de formato de CPF/placa no banco (o
  registro de produção com `cpf = '123.123.123-12'` tem dígito verificador
  inválido e não pode ficar impossibilitado de receber UPDATE de
  aprovação/recusa).
- [ ] Migration aplicada primeiro no projeto QA (`fqgmmmxxqzopcwbsdqgk`), só
  depois em produção (`kccgazitxagxcbsuuiwn`), com o mesmo nome de arquivo.
- [ ] Nenhum backfill dos 4 registros existentes — eles continuam com
  `pessoas = null` e `placas = null` (modo legado, resolvido no fallback de
  leitura, não escrevendo dado fabricado).

### Camada de dados (`src/lib/visitantes-data.ts`, novo arquivo)

- [ ] Tipos `VisitanteStatus`, `VisitanteTipo`, `VisitantePessoa` (`{ nome:
  string; cpf: string | null }`) e `VisitanteRow` (incluindo `pessoas:
  VisitantePessoa[] | null` e `placas: string[] | null`) centralizados aqui e
  reexportados/importados pelos dois componentes de UI.
- [ ] Funções derivadoras `pessoasDoVisitante(v)` e `placasDoVisitante(v)` que
  retornam a lista nova quando presente, e caem para
  `[{ nome: v.nome_visitante, cpf: v.cpf }]` / `v.placa_veiculo ? [v.placa_veiculo]
  : []` quando `pessoas`/`placas` são `null` (registro legado).
- [ ] `maskCpf`, `cpfDigits`, `isCpfValido` (mod-11, rejeitando sequências de
  dígito repetido), `maskPlaca`, `isPlacaValida` (regex cobrindo Mercosul e
  formato antigo) e `fmtDataBr` centralizados aqui, sem duplicação entre
  resident e admin section.
- [ ] Funções de CRUD (`fetchVisitantesDoMorador`, `fetchVisitantesDoCondominio`,
  `criarVisitante`, `deletarVisitante`, `atualizarStatusVisitante`) migradas
  para este módulo, seguindo o padrão de `src/lib/classificados-data.ts`
  (`async`, `input` tipado inline, `if (error) throw error`).
- [ ] `criarVisitante` grava, além de `pessoas`/`placas`, as colunas legadas
  denormalizadas a partir da lista nova: `nome_visitante = pessoas[0].nome`,
  `cpf = pessoas[0].cpf`, `placa_veiculo = placas[0] ?? null`,
  `acompanhantes = pessoas.length - 1` (agora significativo para os dois
  tipos de visita, não só Airbnb).

### Formulário do morador (`src/components/visitantes-novo-dialog.tsx`, novo
arquivo extraído de `visitantes-resident-section.tsx`)

- [ ] Seletor "Quantas pessoas vão entrar?" com valores de 1 a 8 (`<Select>`,
  não `<Input type="number">`), disponível para os dois tipos (Visita e
  Airbnb/Temporada).
- [ ] Para cada pessoa, um bloco com "Nome completo" (obrigatório, mínimo 3
  caracteres) e "CPF" (obrigatório, com máscara e validado por dígito
  verificador).
- [ ] Seletor "Quantos carros vão entrar?" com valores de 0 a 2. Em 0, nenhum
  campo de placa aparece.
- [ ] Para cada carro, um campo de placa com máscara (maiúsculas, sem
  caracteres não alfanuméricos, até 7 caracteres) validado contra o formato
  Mercosul (`ABC1D23`) ou antigo (`ABC1234`).
- [ ] Datas de entrada e saída permanecem abaixo da lista de pessoas/carros,
  com a validação já existente (ambas obrigatórias, saída não anterior à
  entrada).
- [ ] Aumentar/diminuir o contador de pessoas ou de carros redimensiona o
  array de blocos sem duplicar estado (o contador é derivado de
  `array.length`, não um `useState` paralelo).
- [ ] Diminuir o contador quando alguma das linhas que seriam removidas já tem
  nome, CPF ou placa preenchidos pede confirmação (`confirm()`, fora do
  updater de `setState` para não disparar duas vezes em StrictMode); cancelar
  mantém os dados e o contador.
- [ ] Cada bloco de pessoa (a partir da segunda) e cada bloco de placa tem uma
  ação de remover individual.
- [ ] Submissão bloqueada com mensagem específica (via `toast.error`,
  indicando o número da pessoa/placa) para: nome vazio/curto, CPF inválido,
  CPF duplicado entre pessoas da mesma submissão, placa em formato inválido,
  placa duplicada entre carros da mesma submissão.
- [ ] Ao bloquear por erro num bloco fora da área visível do dialog (ex.
  pessoa 6 de 8), a tela rola até o campo e ele recebe foco.
- [ ] Dialog permanece utilizável com 8 pessoas + 2 carros: rolagem interna
  não esconde os botões "Cancelar"/"Cadastrar".
- [ ] `resetForm()` volta ao estado inicial (1 pessoa vazia, 0 carros) ao
  fechar o dialog ou após "Cadastrar outro visitante".

### Exibição (`visitantes-resident-section.tsx` e `visitantes-admin-section.tsx`)

- [ ] O card do morador e o card da síndica mostram a lista completa de
  pessoas (nome + CPF de cada uma) e a lista completa de placas, usando os
  derivadores `pessoasDoVisitante`/`placasDoVisitante` — funcionam tanto para
  cadastros novos quanto para os 4 registros legados (que renderizam 1 pessoa
  com "CPF não informado" e a placa antiga, sem erro).
- [ ] Badge de contagem de pessoas ("N pessoas") aparece para os dois tipos de
  visita quando há mais de 1 pessoa (hoje só aparecia para Airbnb).
- [ ] Nomes na lista usam `break-words` (não `truncate`) para não esconder
  informação que a portaria precisa.
- [ ] `admin-pendencias-badge.tsx` não precisa de nenhuma alteração (a
  contagem é por `count: "exact", head: true` sobre `status`, indiferente às
  colunas novas) — confirmar que continua funcionando, não editar.

## Fora de escopo

- Adicionar "prestador de serviço" como terceiro tipo de visita — não foi
  pedido, e a modelagem atual (`tipo_visita: "visita" | "airbnb"`) não muda.
- Backfill/migração de dados dos 4 registros de produção existentes.
- Validação de CPF/placa como CHECK constraint no banco.
- Normalizar `pessoas`/`placas` em tabelas relacionais separadas.
- Redesenhar visualmente os cards além do necessário para mostrar as listas
  (a síndica já aprovou o modelo visual atual).
- Qualquer mudança em `src/components/ui/dialog.tsx` (componente
  compartilhado — o scroll necessário já existe nele).
- Suportar mais de 8 pessoas ou mais de 2 carros.
