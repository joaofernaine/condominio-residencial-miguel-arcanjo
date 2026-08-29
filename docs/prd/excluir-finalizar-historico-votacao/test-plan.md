# Test Plan — excluir-finalizar-historico-votacao

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; usa o Supabase
> de QA dedicado (`fqgmmmxxqzopcwbsdqgk`), nunca o de produção, pra escrever
> dados de teste (criar pauta, votar, excluir, encerrar).

## Ambiente usado neste round de QA

- `.env` local trocado temporariamente por `.env.qa` (existia no repo,
  `gitignore`d) para apontar `bun run dev`/`vite dev` para o Supabase de QA
  (`fqgmmmxxqzopcwbsdqgk`), restaurado ao `.env` de produção original ao
  final da sessão.
- Servidor: `node_modules\.bin\vite dev` (bun não está no PATH deste
  ambiente de QA; `vite dev` direto funcionou, confirmando o fallback do
  `ambiente.md`) — subiu limpo na porta 8080.
- Login síndica: `joaovftoledo1@gmail.com` / `SenhaTeste123!` (credenciais já
  documentadas em `docs/prd/financeiro-sindica-tabela-mobile/test-plan.md`,
  confirmadas funcionando neste round).
- Não havia morador de teste utilizável para votar (o único morador
  pré-existente no QA, "Maria Aparecida Fernandes de Oliveira Santos", não
  tinha credenciais conhecidas). Criei um morador descartável pela própria
  UI da síndica ("Cadastrar morador", senha provisória `Mudar@123`, depois
  trocada para `SenhaTeste123!` no fluxo obrigatório de primeiro acesso):
  email `qa.votante.pautas@example.com`, nome "QA Votante Teste", unidade
  A-999. Usado só para registrar votos de teste via UI real (não mock).
- Verificação direta no banco: como não tenho acesso MCP ao projeto Supabase
  de QA (o MCP Supabase disponível neste ambiente está escopado a outro
  projeto/conta, "UBADESKLIMP"), usei o REST API do PostgREST do próprio QA
  (`https://fqgmmmxxqzopcwbsdqgk.supabase.co/rest/v1/...`) com o
  `access_token` da sessão autenticada da síndica (extraído do
  `localStorage` do navegador via Playwright) + a anon key pública do
  `.env.qa`. Isso é uma consulta direta ao banco via API, independente da
  lógica do app (não passa por `portal-data.ts` nem pelo estado React) — é
  o mais próximo de "consulta direta ao Supabase" que este ambiente permite
  sem uma chave `service_role`.

---

- [x] Build (`bun run build` ou `vite build`) passa sem erro.

  Comando: `node_modules/.bin/vite build` (bun não está no PATH deste
  ambiente Bash; usado o fallback documentado em `ambiente.md`).

  ```
  EXIT CODE: 0
  ```

  Trecho relevante da saída:
  ```
  vite v8.1.4 building client environment for production...
  transforming...✓ 6609 modules transformed.
  rendering chunks...
  computing gzip size...
  ...
  ✓ built in 755ms
  [nitro] Using auto generated worker name: joaofernaine-condominio-residencial-miguel-arcanjo
  ℹ Generated .output/server/wrangler.json
  ℹ Generated .wrangler/deploy/config.json
  ℹ Generated .output/public/_headers
  ℹ Generated .output/nitro.json
  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```

- [x] Login como síndica (ou admin_agencia em visão síndica), na seção
      "Votações": existe uma pauta ativa (criar uma via "Nova pauta" se não
      houver nenhuma). A aba "Ativas" mostra essa pauta, com botões
      "Finalizar" e "Excluir" visíveis no card.

  Login via Playwright real (`http://localhost:8080` → "Entrar no Portal do
  Morador" → email `joaovftoledo1@gmail.com` / senha `SenhaTeste123!`) →
  redirecionou para "Painel da Síndica". Já existiam 2 pautas ativas
  pré-cadastradas no QA. Snapshot de acessibilidade da aba "Ativas"
  (Playwright `browser_snapshot`), trecho:

  ```yaml
  - tablist:
      - tab [selected]: Ativas
      - tab: Encerradas
  - tabpanel "Ativas":
      - generic:
          - paragraph: Aprovação do orçamento para reforma completa da fachada e pintura das áreas comuns
          - generic: 1 voto
          - button "Finalizar"
          - button "Excluir"
          - button "Auditar votação"
      - generic:
          - paragraph: Nova quadra poliesportiva
          - generic: 0 votos
          - button "Finalizar"
          - button "Excluir"
          - button "Auditar votação"
  ```

  Confirmado: aba "Ativas" selecionada por padrão, botões "Finalizar" e
  "Excluir" visíveis em cada card ativo.

- [x] Clicar em "Excluir" numa pauta ativa abre diálogo de confirmação
      ("Excluir votação... não pode ser desfeita"). Cancelar fecha o diálogo
      sem apagar nada (recarregar a página confirma que a pauta continua lá).

  Cliquei "Excluir" no card "Nova quadra poliesportiva". Diálogo capturado
  (Playwright snapshot):

  ```yaml
  - dialog:
      - heading "Excluir votação"
      - paragraph: "Tem certeza que deseja excluir esta votação? Todos os votos
        registrados nela serão apagados permanentemente. Esta ação não pode ser
        desfeita."
      - button "Cancelar" [active]
      - button "Excluir"
  ```

  Cliquei "Cancelar" → diálogo fechou. Recarreguei a página inteira
  (`browser_navigate` para `http://localhost:8080`, nova sessão de app) e
  aguardei o texto "Nova quadra poliesportiva" aparecer de novo na aba
  Ativas — apareceu, confirmando que nada foi apagado pelo cancelamento.

- [x] Confirmar a exclusão: a pauta some da lista, aparece toast de sucesso,
      e uma consulta direta ao Supabase de QA (`votos` e `pautas` pelo id)
      confirma que tanto a pauta quanto os votos associados foram removidos
      do banco.

  Para testar o cascade de exclusão de votos de verdade (não com uma pauta
  vazia), criei uma pauta descartável dedicada via "Nova pauta"
  ("QA DELETE TEST - pauta descartável", id `5a1fb24d-f0ac-4726-907e-aba2b8816de9`),
  depois logei como o morador de teste (`qa.votante.pautas@example.com`) e
  votei "Sim" nela pela UI real (voto id `eb986da3-8646-4465-9bed-4fadb907f9fd`).

  Voltei como síndica, cliquei "Excluir" no card "QA DELETE TEST" e
  confirmei. Toast capturado via `browser_wait_for text="Votação excluída"`
  — apareceu. A pauta desapareceu da aba Ativas (confirmado por snapshot
  subsequente, não constava mais na lista).

  Consulta direta via REST/PostgREST do Supabase de QA (JWT da sessão da
  síndica + anon key), rodada logo depois da exclusão:

  ```
  --- pauta by id ---
  []
  --- voto by id ---
  []
  --- votos by pauta_id ---
  []
  ```

  Pauta e voto associado confirmados removidos do banco (não apenas do
  estado da UI).

- [x] Criar uma nova pauta e registrar ao menos um voto nela (como morador,
      ou inserindo direto no Supabase de QA). Como síndica, clicar em
      "Finalizar" nessa pauta abre diálogo de confirmação. Confirmar:
      - A pauta some da aba "Ativas".
      - A pauta passa a aparecer na aba "Encerradas", com o resultado
        (contagem de sim/não) preservado e badge "Encerrada" visível.
      - Consulta direta ao Supabase de QA confirma `status = 'encerrada'` e
        `data_fim` atualizado pra data de hoje.

  Usei a pauta pré-existente "Nova quadra poliesportiva"
  (`fc522d40-03f5-408c-937e-f4b888aa64a3`), na qual o morador de teste votou
  "Sim" pela UI real (voto id `b27bbdd5-1eea-42e1-a199-af8ff27238f1`).

  Como síndica, cliquei "Finalizar" no card. Diálogo capturado:

  ```yaml
  - dialog:
      - heading "Finalizar votação"
      - paragraph: "Tem certeza que deseja encerrar esta votação antes da data
        prevista? Os moradores não poderão mais votar e o resultado atual será
        considerado final. Esta ação não pode ser desfeita."
      - button "Cancelar" [active]
      - button "Finalizar"
  ```

  Confirmei ("Finalizar"). Toast "Votação finalizada." apareceu
  (`browser_wait_for` confirmou o texto).

  Aba "Ativas" depois da ação (via `innerText` do tabpanel ativo):
  ```
  Aprovação do orçamento para reforma completa da fachada e pintura das áreas comuns
  ...
  Finalizar
  Excluir
  Auditar votação
  ```
  ("Nova quadra poliesportiva" não consta mais — só a outra pauta ativa.)

  Aba "Encerradas" (cliquei na tab, capturei `innerText` do tabpanel ativo):
  ```
  Nova quadra poliesportiva

  ENCERRADA

  Votação sobre a instalação de uma quadra poliesportiva no lugar do playground antigo.

  1 voto
  Sim — 1
  100%
  Não — 0
  0%

  Participação: 1 morador

  Excluir
  Auditar votação
  ```
  Badge "ENCERRADA" visível, resultado preservado (Sim 1/100%, Não 0/0%).

  Consulta direta via REST/PostgREST logo após a finalização:
  ```
  [{"id":"fc522d40-03f5-408c-937e-f4b888aa64a3","titulo":"Nova quadra poliesportiva","status":"encerrada","data_fim":"2026-08-29"}]
  ```
  `status = "encerrada"` e `data_fim = "2026-08-29"` (data de hoje no
  ambiente, confirmada também pelo `<currentDate>` desta sessão).

- [x] Na aba "Encerradas", o botão "Finalizar" não aparece (já está
      encerrada), só "Excluir" e "Auditar votação". Auditar votação
      continua funcionando igual (mostra lista de quem votou o quê).

  Já evidenciado no item anterior: o `innerText` do card na aba Encerradas
  lista só "Excluir" e "Auditar votação" (sem "Finalizar"). Cliquei
  "Auditar votação" no card e capturei o resultado:

  ```
  REGISTRO DE AUDITORIA
  Participantes: 1
  SIM: 1
  NÃO: 0
  Unidade	Morador	Voto	Data & hora
  A-999	QA Votante Teste	SIM	29/08/2026, 13:46:42
  ```

  Auditoria funcionando normalmente numa pauta encerrada, mostrando quem
  votou o quê.

- [x] Como morador (não síndica), a pauta finalizada não aparece na tela de
      votação do morador (nem antes nem depois de finalizada — ela já não
      aparecia porque não está mais "ativa"). Confirma que a experiência do
      morador não mudou.

  Login como o morador de teste (`qa.votante.pautas@example.com` /
  `SenhaTeste123!`) depois da finalização de "Nova quadra poliesportiva".
  `innerText` da seção "Votações em andamento" do Portal do Morador:

  ```
  ENQUETES ATIVAS
  Votações em andamento

  Sua opinião conta. Cada morador pode votar apenas uma vez por enquete.

  Enquete aberta
  VOTO SIGILOSO
  Aprovação do orçamento para reforma completa da fachada e pintura das áreas comuns

  Votação sobre o orçamento apresentado pela empreiteira selecionada.

  Votar Sim
  Votar Não
  ```

  Só a pauta ainda ativa aparece; "Nova quadra poliesportiva" (encerrada)
  não aparece na lista do morador. `PollCard`/`fetchPautasAtivas` do
  morador não foram alterados pela feature, e o comportamento observado
  confirma isso.

## Observações finais

- Todos os 7 itens do plano puderam ser testados de ponta a ponta contra o
  Supabase de QA dedicado (`fqgmmmxxqzopcwbsdqgk`), sem nenhum bloqueio —
  as credenciais de síndica já documentadas em outra tarefa funcionaram, e
  um morador de teste descartável foi criado pela própria UI (fluxo real,
  não mock) para poder registrar votos.
- Dados de teste deixados no Supabase de QA (aceitável, é ambiente
  descartável dedicado a QA): morador `qa.votante.pautas@example.com`
  (unidade A-999) e a pauta "Nova quadra poliesportiva" agora com
  `status = 'encerrada'`. A pauta "QA DELETE TEST" criada para o teste de
  exclusão foi removida como parte do próprio teste.
- Um erro de hidratação do React (`data-tsd-source` mismatch) apareceu no
  console em todo carregamento de página — é ruído de uma ferramenta de dev
  tooling (atributo injetado em tempos diferentes client/server), não
  relacionado à feature testada, e não impediu nenhuma das interações.
- Ambiente restaurado ao final: `.env` de volta para as credenciais de
  produção originais, servidor de dev encerrado.
