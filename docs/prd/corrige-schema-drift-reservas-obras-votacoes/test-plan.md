# Test Plan — corrige-schema-drift-reservas-obras-votacoes

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

> NOTA (implementador, 2026-07-20): a migration de colunas foi aplicada
> só no Supabase de QA (`fqgmmmxxqzopcwbsdqgk`) — produção
> (`kccgazitxagxcbsuuiwn`) já tinha o schema correto (confirmado via
> `information_schema.columns` antes de mexer em qualquer coisa lá), com
> dados reais (5 reservas, 1 obra, 1 pauta, 2 votos). Nenhuma migration de
> schema foi aplicada em produção. Único ajuste em produção: backfill de
> `condominio_id` em 2 linhas de `votos` que estavam NULL por causa do bug
> separado do `registrarVoto` (ver requirements.md) — confirmado com o
> usuário antes de rodar. Todos os itens abaixo já foram exercitados pelo
> implementador via Playwright no QA (não conta como o check de QA
> independente exigido pela regra do projeto — QA deve refazer tudo do
> zero).

- [ ] Login como síndica no Supabase de QA, criar uma nova obra com
  título, status e descrição preenchidos. Confirmar que salva sem erro e
  que "Andamento das obras" lista a obra com a descrição visível (não só
  título/status).
  <saída crua aqui>

- [ ] Login como morador, solicitar uma reserva de espaço preenchendo o
  campo "Observações". Confirmar que salva sem erro (nem toast de erro,
  nem crash de página) e que a observação aparece tanto no card do
  morador quanto na lista do admin.
  <saída crua aqui>

- [ ] Como síndica, abrir "Gerenciamento de Reservas" com pelo menos uma
  reserva real cadastrada — confirmar que a página carrega normalmente
  (sem tela "Não foi possível carregar a página").
  <saída crua aqui>

- [ ] Como síndica, criar uma nova pauta de votação com data de início e
  fim. Confirmar que salva sem erro.
  <saída crua aqui>

- [ ] Com pelo menos um voto registrado numa pauta, abrir "Resultados em
  tempo real" (admin) e confirmar que os votos carregam sem erro (sem
  toast "Erro ao carregar votações").
  <saída crua aqui>

- [ ] Rodar `npm run build` (ou `bun run build`) e colar a saída completa,
  confirmando build sem erro.
  <saída crua aqui>
