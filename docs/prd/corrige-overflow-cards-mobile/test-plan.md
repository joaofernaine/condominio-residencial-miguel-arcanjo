# Test Plan — corrige-overflow-cards-mobile

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

- [ ] Viewport 375×667, admin logado, com um visitante pendente de nome
  longo cadastrado: confirmar via `getBoundingClientRect()` que o badge
  de status e os botões "Aprovar"/"Recusar" têm `right <= 375` (nada
  cortado na borda). Colar o resultado do evaluate.
  <saída crua aqui>

- [ ] Mesmo teste na seção "Meus visitantes" do morador
  (`visitantes-resident-section.tsx`).
  <saída crua aqui>

- [ ] Mesmo teste (bounding box do badge de status + botão de ação) nas
  seções "Chamados" (admin e morador) e "Mensagens externas" (admin) com
  dados de teste de texto longo.
  <saída crua aqui>

- [ ] Mesmo teste na lista "Datas bloqueadas" do admin de reservas.
  <saída crua aqui>

- [ ] Viewport 1280×800 (desktop): screenshot antes/depois dos mesmos
  cards, confirmando que não há mudança visual perceptível (o fix só age
  quando o conteúdo não cabe).
  <saída crua aqui>

- [ ] Rodar `npm run build` (ou `bun run build`) e colar a saída completa,
  confirmando build sem erro.
  <saída crua aqui>
