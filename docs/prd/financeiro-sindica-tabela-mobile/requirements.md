# Requirements — financeiro-sindica-tabela-mobile

## Contexto
Usuário reportou que "o financeiro do morador quebra no mobile". Investigação:

- **Painel da síndica**, seção "Unidades & cobranças"
  (`src/routes/index.tsx:1795-1871`): confirmado quebrado. É uma
  `<Table>` de 4 colunas (Unidade, Morador responsável, Status, Ações com
  3 botões ícone+texto). Screenshot real em 390px (login como síndica QA)
  mostra colunas desalinhadas, texto do nome do morador espremido numa
  coluna estreita, e os botões de ação ("Histórico"/"Editar"/"Excluir")
  cortados na borda direita, exigindo rolagem horizontal *dentro do card*
  pra achar o resto. **Corrigido** (ver Requisitos).
- **Portal do morador** ("Meu histórico"): testado inicialmente via
  Playwright (login real como `morador.qa.mobile@example.com` no
  Supabase de QA) em 320px/390px usando
  `document.documentElement.scrollWidth <= clientWidth` como critério —
  deu "sem overflow". **Esse critério estava errado**: o usuário mandou
  print do celular (produção, `arcanjo.lovable.app`) mostrando a seção
  "Meu histórico" genuinamente cortada (cards sem borda direita, texto
  cortado no meio, sem nada a mais pra rolar). Reproduzido depois: `<html>`
  tem `overflow-x: hidden` (efeito colateral do fix em
  [[corrige-overflow-cards-mobile]]), que faz `document.documentElement`
  reportar "sem overflow" mesmo quando `document.body.scrollWidth` está
  quase 2× a largura da viewport (739px vs 360px). Causa raiz: os dois
  `<Reveal>` (que renderizam `<div>` puro) dentro de `grid gap-12
  lg:grid-cols-[1fr_2fr]` (linha ~1305) são itens de grid sem `min-w-0` —
  mesmo padrão de bug já corrigido em outros componentes por
  [[corrige-overflow-cards-mobile]], mas essa seção específica nunca
  recebeu o fix. Isso derruba a confiabilidade de qualquer auditoria
  anterior (incluindo [[responsivo-mobile-375]] e o QA desta própria
  tarefa) que usou `documentElement.scrollWidth` como critério de
  "sem overflow" — o critério correto é `document.body.scrollWidth`
  (ou medir `getBoundingClientRect()` de elementos reais). **Corrigido**
  (ver Requisitos).

## Perguntas em aberto
Nenhuma — as duas quebras relatadas pelo usuário (síndica e morador)
foram reproduzidas e corrigidas. Varredura full-page com
`document.body.scrollWidth` confirmou zero elementos overflowing no
dashboard do morador e no da síndica, exceto a tabela "Gerenciamento de
Reservas" (síndica), que tem rolagem horizontal *contida* (mesmo padrão
que "Unidades & cobranças" tinha antes do fix) — deixada fora de escopo
por decisão do usuário (ver "Fora de escopo").

## Requisitos

- [ ] Abaixo do breakpoint `md` (768px), a tabela "Unidades & cobranças"
  (painel da síndica) renderiza como lista de cards empilhados (um por
  unidade) em vez de `<table>`, seguindo o padrão de card já usado em
  outras listas do portal (ex. "Minhas reservas", "Meus chamados").
- [ ] Em telas `md` (768px) pra cima, o layout de tabela atual é mantido
  sem mudança visual.
- [ ] Cada card mostra: unidade, nome completo do morador, status do mês
  atual (badge), e os três botões de ação (Histórico/Editar/Excluir) —
  todos visíveis e clicáveis sem qualquer rolagem horizontal, em 320px e
  375px de largura de viewport.
- [ ] Nome de morador longo (ex. "Maria Aparecida Fernandes de Oliveira
  Santos") não corta nem quebra o layout do card.
- [ ] Clicar no card (fora dos botões de ação) abre o histórico mensal —
  mesmo comportamento que hoje existe ao clicar na linha da tabela.
- [ ] `document.body.scrollWidth <= document.documentElement.clientWidth`
  em 320px e 375px nessa seção (critério correto — não usar
  `document.documentElement.scrollWidth`, que fica mascarado pelo
  `overflow-x: hidden` do `<html>`).
- [ ] Seção "Meu histórico" do morador (`src/routes/index.tsx:1305-1326`,
  os dois `<Reveal>` dentro de `grid gap-12 lg:grid-cols-[1fr_2fr]`)
  ganham `min-w-0`, permitindo que a coluna encolha em vez de forçar a
  largura mínima do conteúdo. Em 320px/375px logado como morador:
  `document.body.scrollWidth <= document.documentElement.clientWidth` e
  nenhum elemento real (`getBoundingClientRect().right`) ultrapassa a
  largura do viewport.
- [ ] Varredura full-page (ambos os dashboards, morador e síndica) com
  `document.body.scrollWidth` em 320px/375px confirmando que não sobrou
  nenhum outro elemento overflowing além da tabela "Gerenciamento de
  Reservas" (fora de escopo, ver abaixo).
- [ ] `bun run build` (ou `npm run build`) passa sem erro depois da
  mudança.

## Fora de escopo
- A tabela "Gerenciamento de Reservas" (mesma seção do painel da síndica,
  `src/routes/index.tsx`, ~linha 1954) tem exatamente o mesmo padrão que
  "Unidades & cobranças" tinha antes do fix (6 colunas, botões cortados,
  rolagem contida dentro do card) — não corrigida aqui. Fica registrado
  como achado pra uma tarefa futura se o usuário quiser.
- Redesign visual além do necessário pra corrigir os dois overflows
  (paleta, tipografia, ícones novos).
- **Achados do QA em 320px (mesmo padrão `min-w-0` faltando, não
  corrigidos aqui)**: "Votações em andamento" (morador, `.reveal
  .reveal-in` dentro de `grid gap-6 md:grid-cols-2`), badge "1 pedido
  pendente" no cabeçalho de "Gerenciamento de Reservas" (síndica), aba
  "Planejadas" em "Andamento das obras" (síndica), e o formulário +
  lista de "Documentos" (síndica). Todos só aparecem em 320px (não em
  375px), e usam o mesmo `document.body.scrollWidth`/
  `getBoundingClientRect()` como critério de detecção correto. Candidatos
  a uma tarefa futura de "varredura 320px" dedicada.
