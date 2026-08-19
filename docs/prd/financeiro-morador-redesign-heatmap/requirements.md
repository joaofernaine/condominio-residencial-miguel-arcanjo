# Requirements — financeiro-morador-redesign-heatmap

## Contexto
Usuário achou o "Meu histórico" (seção financeira do morador,
`MyPaymentGrid` em `src/routes/index.tsx`) feio e pediu um redesign focado
em deixar claro quais meses já foram pagos e quais não. Foram propostos 3
mockups visuais (artifact publicado com as 3 opções, usando a paleta real
do site — cobalto/mármore/madeira/turquesa) e o usuário escolheu a
**opção B: grade estilo calendário** (12 blocos coloridos por mês, tipo
"GitHub contributions").

## Perguntas em aberto
Nenhuma — opção B confirmada pelo usuário.

## Requisitos

- [ ] `MyPaymentGrid` substitui a lógica de "expandir/recolher" por uma
  grade sempre visível de 12 blocos (um por mês, `grid-cols-6`), coloridos
  por status: verde/turquesa (Em dia), vermelho (Atrasado), laranja/madeira
  (Pendente), cinza (A faturar — meses futuros — ou sem registro).
- [ ] O mês atual tem um destaque visual (anel/contorno) sobre o bloco
  correspondente.
- [ ] Acima da grade, um resumo textual do tipo "X de Y meses em dia" (Y =
  meses já decorridos no ano) + contagem de atrasados/pendentes quando
  houver.
- [ ] Meses passados sem nenhum registro no banco (`historico_financeiro`)
  contam separado de "Pendente" de verdade no resumo — não devem inflar a
  contagem de pendências (mostram como "A faturar"/neutro na grade, sem
  entrar no texto de resumo).
- [ ] Legenda com as 4 cores abaixo da grade.
- [ ] Sem rolagem horizontal em 320px e 375px (`document.body.scrollWidth
  <= document.documentElement.clientWidth`).
- [ ] Nenhuma mudança visual/funcional fora do componente `MyPaymentGrid`
  (o resto da seção "Meu histórico" — texto intro, filtros de documentos —
  continua igual).
- [ ] `npm run build` (ou `bun run build`) passa sem erro.

## Fora de escopo
- Mudanças na tabela "Unidades & cobranças" do painel da síndica (já
  tratada em [[financeiro-sindica-tabela-mobile]]).
- Qualquer integração com o Fundo de Obras / importação de relatório PDF
  (tarefa separada, [[fundo-obras-importacao-pdf]]).
