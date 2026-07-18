# Aprendizados — 2026-07-18: Setup do harness + Supabase de QA

## O que foi feito

Primeira sessão de Harness Engineering no projeto. Rodou as 5 fases:
1. Scan do projeto (stack, arquitetura, convenções, comandos) com execução
   real de cada comando.
2. Perguntas de porquê ao usuário (escopo single-tenant, status
   pré-lançamento, decisão de lint, escolha do ambiente de QA).
3. Estrutura de docs criada (`CLAUDE.md`, `docs/projeto/*`,
   `docs/prd/_template/*`).
4. Regras de processo escritas no `CLAUDE.md` (requirements → test plan → QA
   separado → só QA marca check → aprendizados ao fechar sessão).
5. Prova real: montagem de um Supabase de QA dedicado (`fqgmmmxxqzopcwbsdqgk`),
   do requirements.md ao QA verificando 8/8 itens com saída crua.

## Achados técnicos importantes

### Schema drift em produção (o mais relevante)

Ao extrair o schema do projeto de produção (`kccgazitxagxcbsuuiwn`) pra
replicar no QA, descobri que **nem todo o schema real está nas migrations
rastreadas** (`supabase_migrations.schema_migrations` só tem 7 entradas).
Fora do controle de migration:

- **9 tabelas inteiras**: `documentos`, `condominio_config`, `amenidades`,
  `avisos_publicos`, `classificados`, `classificados_fotos`, `visitantes`,
  `chamados`, `contatos_publicos`.
- **RLS policies reescritas** em tabelas que *estavam* rastreadas:
  `profiles`, `pautas`, `votos` (parcial), `reservas` (parcial),
  `historico_financeiro`, `obras`, `obra_atualizacoes`. As policies atuais em
  produção têm nomes e lógica diferentes das criadas pela migration
  `002_row_level_security` — foram substituídas por fora.
- Os 3 **storage buckets** (`classificados-fotos`, `documentos`,
  `obras-fotos`) também nunca foram criados via migration.

**Por que importa**: `profiles` é a tabela mais sensível a escalação de
privilégio (é a que decide `role` e `condominio_id` de cada usuário). Ela
teve a RLS inteira trocada sem deixar rastro de quando ou por quê — nenhuma
revisão, nenhum diff, nenhum commit associado. Isso é provavelmente
resultado de mudanças feitas direto pelo Lovable/SQL editor em vez de CLI
com migration.

**Recomendação para o futuro** (não executada nesta sessão, ficou fora de
escopo): trazer o schema todo pra dentro de `supabase/migrations/` no
repositório (via `supabase db pull` ou equivalente), pra que qualquer
mudança futura em RLS passe a ser rastreável e revisável.

### Duplicação/dívida menor encontrada

- `classificados` tem **duas gerações de RLS coexistindo**:
  `classificados_select/insert/update/delete` (mais recente, com condição
  por `condominio_id`) e `morador_own_classificados` /
  `morador_view_approved` / `sindica_admin_all_classificados` (mais antigas,
  usam `profiles.id = auth.uid()` em vez de `current_profile()`). Ambas
  ativas ao mesmo tempo (policies permissivas se somam com OR) — funciona,
  mas é confuso e vale consolidar.
- `classificados_fotos` tem **3 índices idênticos** redundantes em
  `classificado_id` (`idx_classificados_fotos`,
  `idx_classificados_fotos_classificado_id`,
  `idx_classificados_fotos_classificado`).

Replicados fielmente no Supabase de QA (não "corrigidos" ali), porque o
objetivo era espelhar a verdade de produção, não normalizá-la.

### Ambiente

- **CRLF vs LF**: lint/format falham em massa (~13.988 erros) só por causa de
  quebra de linha, não por bugs reais. Decisão: não usar lint como gate de
  QA. Documentado em `docs/projeto/ambiente.md`.
- **`bun install`** pode falhar na primeira tentativa no Windows (I/O em
  node_modules aninhado) — rodar de novo resolve.
- **Supabase CLI** não vem instalado no PATH; funciona via `bunx supabase`.
- **Playwright (MCP) desconectou** no meio desta sessão — precisa reiniciar
  a sessão pra voltar, antes de qualquer QA que envolva clicar na UI web.

## Decisões de processo tomadas

- Projeto é **single-tenant** (só Miguel Arcanjo); outros condomínios/nichos
  serão forks separados, não uma expansão deste código.
- Supabase de QA é um **projeto novo separado** (free tier, US$ 0/mês) em vez
  de branch nativo (US$ 0,01344/hora) — troca deliberada de sincronização
  automática por custo zero e persistência.
- Lint não é critério de aprovação de QA enquanto o CRLF não for resolvido.
