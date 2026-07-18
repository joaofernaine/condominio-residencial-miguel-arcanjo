# Ambiente

Todos os comandos abaixo foram **executados de verdade** (não presumidos) em
2026-07-18, Windows, com `bun 1.3.14` / `npm 11.16.0` / `node v24.18.0`
disponíveis.

## Instalar

```
bun install
```
⚠️ Na primeira execução pode falhar com `ENOENT: Failed to open node_modules
folder` em pacotes aninhados (ex. `@typescript-eslint/.../node_modules/minimatch`).
É instabilidade de I/O do Windows com bun, não falta de pré-requisito —
**rodar `bun install` de novo resolve** (2ª vez terminou limpo).

## Rodar em dev

```
bun run dev
```
✅ Sobe limpo (`vite dev`). Porta padrão 8080; se ocupada, sobe na próxima
livre (ex. 8081) — confirmado com `curl` retornando HTTP 200.

## Build

```
bun run build
```
✅ Sucesso em ~8s: build client (Vite) + SSR + Nitro (preset
`cloudflare-module`), gera `.output/public`, `.output/server`,
`.output/server/wrangler.json`. Sem pré-requisito além do install.

## Lint / Format

```
bun run lint     # eslint .
bun run format   # prettier --write .
```
❌ **Hoje ambos falham em massa** (~13.988 erros no lint, 90 arquivos no
`prettier --check`) — quase tudo é `Delete "␍"`: o repo está em **CRLF** e o
Prettier exige **LF**. Isso mascara os poucos problemas reais (alguns erros
de encadeamento `.from().select().eq()` e ~10 warnings de
`react-refresh/only-export-components`).

**Decisão do harness**: não usar lint/format como gate de QA enquanto isso
não for resolvido — o gate real é build + teste funcional. Se algum dia
normalizar para LF: `git config core.autocrlf false` + `.gitattributes` com
`* text=auto eol=lf`, depois um `prettier --write .` único e consciente (isso
reescreve ~90 arquivos e sincroniza de volta pro Lovable — fazer isolado, não
misturado com outra mudança).

## Supabase CLI

```
supabase --version   # ❌ não instalado no PATH
bunx supabase --version   # ✅ funciona (download on-demand, v2.109.1)
```
Pra trabalhar localmente com `supabase/functions/criar-morador` (serve,
deploy, dump de schema), instalar formalmente ou usar sempre via `bunx`.

## `.env`

Duas variáveis, **credenciais reais do Supabase de produção** (não
placeholders): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable
key). **Nunca usar este `.env` para escrita de QA** — QA usa um Supabase
dedicado (ver `docs/aprendizados/` conforme for montado).

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
  **schema drift** — 9 tabelas (`documentos`, `condominio_config`,
  `amenidades`, `avisos_publicos`, `classificados`, `classificados_fotos`,
  `visitantes`, `chamados`, `contatos_publicos`) e as RLS policies de
  `profiles`, `pautas`, `votos`, `reservas`, `historico_financeiro`, `obras`
  e `obra_atualizacoes` foram criadas/alteradas **fora do fluxo de
  migration** (não existem nos arquivos rastreados por
  `supabase_migrations.schema_migrations`). Isso inclui a policy de
  `profiles`, que é justamente a mais sensível a escalação de privilégio.
  Replicado fielmente no QA a partir do estado real do banco (via
  `execute_sql`/`pg_policies`), não das migrations antigas. Ver
  `docs/aprendizados/` para o registro completo desse gap.
- **Como usar**: copiar `.env.qa` por cima do `.env` (ou apontar as env vars
  do dev server pra ele) antes de rodar QA local. `.env.qa` está no
  `.gitignore` — não versionar.
- **Nunca** apontar QA pro projeto de produção (`kccgazitxagxcbsuuiwn`) para
  escrita.

## Testes

Não existe nenhum framework de teste, script `test`, CI, ou arquivo
`*.test.*`/`*.spec.*` no projeto hoje (verificado exaustivamente). QA hoje é
100% via agente de QA rodando o Test Plan manualmente (ver regras no
`CLAUDE.md`).
