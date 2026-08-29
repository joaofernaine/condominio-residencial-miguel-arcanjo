# Requirements — excluir-finalizar-historico-votacao

## Contexto
Hoje a área administrativa de "Votações" (`src/routes/index.tsx`, `AdminDashboard`)
só permite criar uma pauta (`criarPauta`) e ver os resultados em tempo real
(`PollAdminCard`/`fetchVotosDePauta`). Não existe forma de: apagar uma pauta
criada por engano, encerrar uma votação antes da `data_fim` prevista, ou
revisitar o resultado de votações já encerradas — depois que uma pauta some
da lista de ativas (`fetchPautasAtivas` filtra `status = "ativa"`), o
resultado fica inacessível pela UI (só via SQL direto).

## Perguntas em aberto (respondidas)
- **Quem vê o histórico de votações encerradas?** → Só síndica/admin. Moradores
  continuam só vendo pautas ativas (`fetchPautasAtivas`, sem mudança).
- **Dá pra reabrir uma votação finalizada antes da hora?** → Não, é definitivo.
  Uma vez `status = "encerrada"`, não existe fluxo de voltar pra "ativa".
- **Onde colocar o histórico na UI?** → Abas "Ativas" / "Encerradas" dentro da
  mesma seção "Votações" já existente (não é uma tela nova separada).

## Requisitos

- [ ] Síndica/admin consegue **excluir** uma pauta (ativa ou encerrada) pela
      UI, com diálogo de confirmação ("Tem certeza... não pode ser desfeita").
      Excluir remove a pauta e todos os votos associados a ela
      (`excluirPauta` em `src/lib/portal-data.ts` deleta de `votos` antes de
      deletar de `pautas`, sem depender de `ON DELETE CASCADE` no banco).
- [ ] Síndica/admin consegue **finalizar antecipadamente** uma pauta ativa
      (antes da `data_fim`), com diálogo de confirmação. Finalizar muda
      `status` de `"ativa"` para `"encerrada"` e atualiza `data_fim` para a
      data real de encerramento (hoje) — `encerrarPauta` em `portal-data.ts`.
      A ação é definitiva (sem "reabrir").
- [ ] Pauta finalizada (ou que já tinha `status = "encerrada"` de outra
      forma) some da lista de "Ativas" e passa a aparecer na aba
      "Encerradas", com o resultado final visível (reaproveita
      `PollAdminCard`/`fetchVotosDePauta`, sem mudança na lógica de contagem
      de votos).
- [ ] Nova query `fetchPautasEncerradas(condominioId)` — filtra
      `status = "encerrada"`, ordenada por `data_fim` desc.
- [ ] Moradores continuam sem ver nada disso — `fetchPautasAtivas` e a
      `PollCard` do morador não mudam.
- [ ] Build (`bun run build` / `vite build`) passa sem erro.

## Fora de escopo
- Reabrir uma votação encerrada (decisão do usuário: é definitivo).
- Histórico visível para moradores (decisão do usuário: só admin, por ora —
  pode virar uma tarefa separada no futuro).
- Mexer na coluna `encerra_em` de `pautas` (órfã, não usada — já documentado
  como fora de escopo em [[corrige-schema-drift-reservas-obras-votacoes]]).
- Notificar moradores quando uma votação é finalizada antecipadamente.
