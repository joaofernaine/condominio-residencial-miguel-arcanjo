# Requirements — corrige-overflow-cards-mobile

## Contexto
Depois de [[responsivo-mobile-375]] (que concluiu que não havia rolagem
horizontal de página em 375px), o usuário reportou visualmente em
`http://localhost:8081` que na seção "Visitantes" (admin) o badge
"Pendente" e os botões "Aprovar"/"Recusar" aparecem cortados na borda
direita da tela.

Investigação (Playwright + `getBoundingClientRect`/`getComputedStyle`)
confirmou a causa: `<ul className="grid gap-3 md:grid-cols-2">` em
`visitantes-admin-section.tsx` — abaixo do breakpoint `md`, isso é um
grid de uma coluna implícita. Grid items têm `min-width: auto` por
padrão (o mesmo problema clássico de flex items), então o `<li>` do
card recusa encolher para caber na track do grid (328px) e cresce até
~406px para acomodar o conteúdo (nome + badge + botões), que faz o card
vazar para a direita. Isso não gera scroll de página porque o `body`
tem `overflow-x: hidden` global — o excesso fica **cortado
silenciosamente** em vez de causar scroll, exatamente o "texto cortado"
reportado.

Mesmo padrão (`<li>` grid item sem `min-w-0`, com uma coluna de
badge/ações que não quebra linha) confirmado também em
`visitantes-resident-section.tsx`. Os cards de chamados
(`chamados-admin-section.tsx`, `chamados-resident-section.tsx`) e de
mensagens externas (`mensagens-externas-admin-section.tsx`) têm o mesmo
tipo de estrutura mas usam `flex-wrap` na linha principal (ou não têm
coluna de largura fixa competindo), o que evita o overflow na prática —
ainda assim, recebem o mesmo `min-w-0` defensivo por consistência e
porque é uma mudança sem efeito colateral quando não há overflow. O
mesmo problema também existe em `src/routes/index.tsx` na lista de
"Datas bloqueadas" (linha ~2582), com a mesma estrutura sem `flex-wrap`.

## Requisitos

- [ ] `visitantes-admin-section.tsx`: `<li>` do card (linha ~172) ganha
  `min-w-0`, permitindo que o item do grid encolha para a largura da
  track em vez de forçar overflow. Badge "Pendente"/"Aprovado"/"Recusado"
  e botões "Aprovar"/"Recusar" ficam inteiramente visíveis em 375px.
- [ ] Mesmo fix em `visitantes-resident-section.tsx` (linha ~138).
- [ ] Mesmo fix defensivo (`min-w-0` no `<li>`) em
  `chamados-admin-section.tsx` (~171), `chamados-resident-section.tsx`
  (~224), `mensagens-externas-admin-section.tsx` (~103) e na lista de
  "Datas bloqueadas" em `src/routes/index.tsx` (~2582).
- [ ] Confirmado via Playwright (viewport 375×667, com dados de teste
  reais — nome de visitante/morador longo) que nenhum desses cards causa
  conteúdo cortado/invisível: medir `getBoundingClientRect()` do badge de
  status e dos botões de ação, confirmando que ficam dentro dos limites
  do viewport (right <= 375).
- [ ] Nenhuma mudança visual em telas ≥768px (onde o grid já tinha espaço
  de sobra) — checar lado a lado antes/depois num viewport desktop.
- [ ] Build (`bun run build` ou `npm run build`) passa sem erro.

## Fora de escopo
- Redesenhar os cards (layout, cores, hierarquia visual) além do fix de
  overflow.
- Adicionar `min-w-0` preventivamente em outros componentes fora dos
  listados acima (ex. cards de amenidades, documentos, obras) — só nos
  pontos onde o padrão de risco (grid item + coluna de largura fixa sem
  `flex-wrap`) foi identificado.
