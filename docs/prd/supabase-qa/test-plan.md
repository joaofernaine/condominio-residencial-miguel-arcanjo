# Test Plan — Supabase de QA

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — aqui o QA usa as ferramentas MCP do Supabase e
> comandos reais, não simulação.

- [x] Projeto de QA existe, está `ACTIVE_HEALTHY`, na org `JOAO_VFT`,
      região `sa-east-1`.

  `mcp__claude_ai_Supabase__get_project(id="fqgmmmxxqzopcwbsdqgk")`:
  ```json
  {"id":"fqgmmmxxqzopcwbsdqgk","ref":"fqgmmmxxqzopcwbsdqgk","organization_id":"ynccxgfqckbylfofhtrg","organization_slug":"ynccxgfqckbylfofhtrg","name":"Condominio Miguel Arcanjo - QA","region":"sa-east-1","status":"ACTIVE_HEALTHY","database":{"host":"db.fqgmmmxxqzopcwbsdqgk.supabase.co","version":"17.6.1.147","postgres_engine":"17","release_channel":"ga"},"created_at":"2026-07-18T03:44:27.253936Z"}
  ```
  Confirmado org via `list_organizations`:
  ```json
  {"organizations":[{"id":"ynccxgfqckbylfofhtrg","slug":"ynccxgfqckbylfofhtrg","name":"JOAO_VFT"}]}
  ```
  `status: ACTIVE_HEALTHY`, `region: sa-east-1`, `organization_id` bate com a org `JOAO_VFT`. OK.

- [x] `list_tables` (schema `public`) no projeto de QA retorna o mesmo
      conjunto de tabelas que `list_tables` no projeto de produção
      (`kccgazitxagxcbsuuiwn`).

  QA (`fqgmmmxxqzopcwbsdqgk`) — 17 tabelas:
  ```json
  {"tables":[{"name":"public.condominios","rls_enabled":true,"rows":0},{"name":"public.profiles","rls_enabled":true,"rows":0},{"name":"public.pautas","rls_enabled":true,"rows":0},{"name":"public.votos","rls_enabled":true,"rows":0},{"name":"public.reservas","rls_enabled":true,"rows":0},{"name":"public.historico_financeiro","rls_enabled":true,"rows":0},{"name":"public.obras","rls_enabled":true,"rows":0},{"name":"public.obra_atualizacoes","rls_enabled":true,"rows":0},{"name":"public.condominio_config","rls_enabled":true,"rows":0},{"name":"public.amenidades","rls_enabled":true,"rows":0},{"name":"public.avisos_publicos","rls_enabled":true,"rows":0},{"name":"public.chamados","rls_enabled":true,"rows":0},{"name":"public.visitantes","rls_enabled":true,"rows":0},{"name":"public.contatos_publicos","rls_enabled":true,"rows":0},{"name":"public.documentos","rls_enabled":true,"rows":0},{"name":"public.classificados","rls_enabled":true,"rows":0},{"name":"public.classificados_fotos","rls_enabled":true,"rows":0}]}
  ```

  Produção (`kccgazitxagxcbsuuiwn`) — 17 tabelas:
  ```json
  {"tables":[{"name":"public.condominios","rls_enabled":true,"rows":1},{"name":"public.profiles","rls_enabled":true,"rows":3},{"name":"public.pautas","rls_enabled":true,"rows":1},{"name":"public.votos","rls_enabled":true,"rows":1},{"name":"public.reservas","rls_enabled":true,"rows":5},{"name":"public.historico_financeiro","rls_enabled":true,"rows":7},{"name":"public.obras","rls_enabled":true,"rows":1},{"name":"public.obra_atualizacoes","rls_enabled":true,"rows":0},{"name":"public.documentos","rls_enabled":true,"rows":1},{"name":"public.condominio_config","rls_enabled":true,"rows":1},{"name":"public.amenidades","rls_enabled":true,"rows":2},{"name":"public.avisos_publicos","rls_enabled":true,"rows":1},{"name":"public.classificados","rls_enabled":true,"rows":2},{"name":"public.classificados_fotos","rls_enabled":true,"rows":1},{"name":"public.visitantes","rls_enabled":true,"rows":4},{"name":"public.chamados","rls_enabled":true,"rows":2},{"name":"public.contatos_publicos","rls_enabled":true,"rows":2}]}
  ```

  Conjunto de nomes de tabela idêntico entre os dois (diferença esperada é só
  em `rows`: QA está vazio, produção tem dados reais). `rls_enabled: true`
  em todas as tabelas nos dois projetos.

- [x] Bucket(s) de storage do domínio existem no projeto de QA (comparar com
      os do projeto de produção).

  Query rodada nos dois projetos: `select id, name, public from storage.buckets order by name;`

  QA (`fqgmmmxxqzopcwbsdqgk`):
  ```json
  [{"id":"classificados-fotos","name":"classificados-fotos","public":true},{"id":"documentos","name":"documentos","public":true},{"id":"obras-fotos","name":"obras-fotos","public":true}]
  ```

  Produção (`kccgazitxagxcbsuuiwn`):
  ```json
  [{"id":"classificados-fotos","name":"classificados-fotos","public":true},{"id":"documentos","name":"documentos","public":true},{"id":"obras-fotos","name":"obras-fotos","public":true}]
  ```

  Idênticos: `classificados-fotos`, `documentos`, `obras-fotos`, todos `public: true` nos dois projetos.

- [x] Edge function `criar-morador` está implantada no projeto de QA
      (`list_edge_functions` ou `get_edge_function`).

  `mcp__claude_ai_Supabase__list_edge_functions(project_id="fqgmmmxxqzopcwbsdqgk")`:
  ```json
  {"functions":[{"verify_jwt":true,"id":"7b654df6-4422-486c-93fa-b3e37f1a6db8","slug":"criar-morador","version":1,"name":"criar-morador","status":"ACTIVE","entrypoint_path":"file:///tmp/user_fn_fqgmmmxxqzopcwbsdqgk_7b654df6-4422-486c-93fa-b3e37f1a6db8_1/source/index.ts","import_map_path":null,"import_map":false,"created_at":1784380903302,"updated_at":1784380903302,"ezbr_sha256":"602ff440d242845ee3e9474be15f687e483a8ee9ec8c1cb2c8097b998d7e92b5"}]}
  ```
  `slug: criar-morador`, `status: ACTIVE`. OK.

- [x] `.env.qa` existe na raiz, tem `VITE_SUPABASE_URL` e
      `VITE_SUPABASE_ANON_KEY` apontando pro projeto de QA (não pro de
      produção — comparar a URL).

  Conteúdo real de `.env.qa` (chave mascarada, só os primeiros ~15 caracteres):
  ```
  VITE_SUPABASE_URL=https://fqgmmmxxqzopcwbsdqgk.supabase.co
  VITE_SUPABASE_ANON_KEY=sb_publishable_0P... (mascarada)
  ```
  `fqgmmmxxqzopcwbsdqgk` é o project ref do QA (confere com `get_project` do
  item 1), não `kccgazitxagxcbsuuiwn` (produção). OK.

- [x] `.gitignore` cobre `.env.qa` (`git check-ignore -v .env.qa` ou
      equivalente retorna a regra que cobre).

  ```
  $ git check-ignore -v .env.qa
  .gitignore:36:.env.qa	.env.qa
  ```
  Linha 36 do `.gitignore` (`.env.qa`) cobre o arquivo diretamente. OK.

- [x] Escrita de teste real funciona: um insert simples numa tabela de baixo
      risco do projeto de QA é executado e confirmado com um select
      subsequente.

  Todos os comandos rodados via `execute_sql` no projeto de QA
  (`fqgmmmxxqzopcwbsdqgk`):

  1) `insert into condominios (nome) values ('QA Test') returning id;`
  ```json
  [{"id":"0c042d79-e7b0-449c-8430-59e6971d0e70"}]
  ```

  2) `insert into contatos_publicos (condominio_id, nome, mensagem) values ('0c042d79-e7b0-449c-8430-59e6971d0e70', 'QA Smoke Test', 'teste de escrita do harness') returning id, created_at;`
  ```json
  [{"id":"2cbf6353-0cc0-4b31-b61f-e0da6aaf3655","created_at":"2026-07-18 13:23:37.931155+00"}]
  ```

  3) `select id, condominio_id, nome, mensagem, created_at from contatos_publicos where id = '2cbf6353-0cc0-4b31-b61f-e0da6aaf3655';`
  ```json
  [{"id":"2cbf6353-0cc0-4b31-b61f-e0da6aaf3655","condominio_id":"0c042d79-e7b0-449c-8430-59e6971d0e70","nome":"QA Smoke Test","mensagem":"teste de escrita do harness","created_at":"2026-07-18 13:23:37.931155+00"}]
  ```
  Insert + select confirmam a linha persistida, sem erro de schema/RLS
  inesperado (RLS não bloqueou a escrita via `execute_sql`, que roda com
  privilégios de service role).

- [x] `docs/projeto/ambiente.md` tem a seção sobre o Supabase de QA (project
      ref, como trocar o `.env`, aviso de nunca escrever no de produção).

  Trecho real do arquivo (seção "## Supabase de QA"):
  ```
  ## Supabase de QA

  Projeto separado, dedicado a QA (nunca usar o de produção pra escrita):

  - **Project ref**: `fqgmmmxxqzopcwbsdqgk` (nome "Condominio Miguel Arcanjo -
    QA", org `JOAO_VFT`, região `sa-east-1`, free tier — US$ 0/mês).
  - **URL**: `https://fqgmmmxxqzopcwbsdqgk.supabase.co`
  - Schema replicado por introspecção do projeto de produção
    (`kccgazitxagxcbsuuiwn`) em 2026-07-18: todas as tabelas, RLS policies,
    buckets de storage (`classificados-fotos`, `documentos`, `obras-fotos`) e a
    edge function `criar-morador`. Sem dados de produção — só estrutura.
  - **Achado importante durante a extração**: o projeto de produção tem
    **schema drift** — 9 tabelas (...) e as RLS policies de (...) foram
    criadas/alteradas **fora do fluxo de migration** (...). Replicado
    fielmente no QA a partir do estado real do banco (via
    `execute_sql`/`pg_policies`), não das migrations antigas. Ver
    `docs/aprendizados/` para o registro completo desse gap.
  - **Como usar**: copiar `.env.qa` por cima do `.env` (ou apontar as env vars
    do dev server pra ele) antes de rodar QA local. `.env.qa` está no
    `.gitignore` — não versionar.
  - **Nunca** apontar QA pro projeto de produção (`kccgazitxagxcbsuuiwn`) para
    escrita.
  ```
  Contém project ref, URL, como trocar o `.env` e o aviso explícito de nunca
  escrever em produção. OK.
