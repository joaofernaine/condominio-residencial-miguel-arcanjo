# Arquitetura

## O que é

Portal web do **Condomínio Residencial Miguel Arcanjo**. Um único condomínio
(**single-tenant** — não é um SaaS multi-condomínio; outros condomínios ou
nichos, como personal trainers, serão **projetos separados forkados deste**,
não uma expansão deste mesmo código).

## Pra quem

- **Moradores** (`role: morador`) — consultam avisos, votam em pautas, reservam
  espaços, veem financeiro/obras/documentos, postam classificados, cadastram
  visitantes esperados, abrem chamados.
- **Síndica** (`role: sindica`) — modera tudo acima do lado admin: aprova
  classificados, responde chamados, aprova/recusa visitantes, cadastra
  moradores, vê mensagens externas (contato público da landing).
- **Administradora/agência** (`role: admin_agencia`) — dono da conta que
  alterna entre visão de síndica e visão de morador (`AgencyAdminView`,
  `src/routes/index.tsx:558-595`).

## Camadas

```
Rotas (src/routes, TanStack Router file-based)
   ▼  auth via src/hooks/use-portal-auth.ts (ou direto supabase.auth em index.tsx)
Componentes de domínio (src/components/*-admin-section.tsx, *-resident-section.tsx)
   ▼
Camada de dados (src/lib/portal-data.ts, src/lib/classificados-data.ts)
   ▼  (src/lib/mocks.ts = tipos/stubs residuais da migração mock→Supabase, não usados em runtime)
Supabase (Postgres + Auth + Storage + Edge Functions)
```

- **Rotas**: convenção de arquivo do TanStack Start — nunca criar
  `src/pages/`. `__root.tsx` é o único layout. Prefixo `admin.*` no nome do
  arquivo (não pasta) separa área administrativa da pública/morador, ex.:
  `admin.classificados.index.tsx` → `/admin/classificados/`. `routeTree.gen.ts`
  é **gerado** — nunca editar manualmente.
- **Client/server**: `src/start.ts` configura middleware de erro do TanStack
  Start; `src/server.ts` é o adapter fetch de baixo nível que recupera erros
  que o h3 (motor HTTP interno do Start) "engole" convertendo em 500 genérico
  — por isso as duas camadas existem, não é redundância.
- **Dados**: toda leitura/escrita real passa por `portal-data.ts` (717
  linhas: profiles, pautas/votos, reservas, financeiro, obras, moradores,
  documentos, amenidades, avisos, config do condomínio, chamada à edge
  function `criar-morador`) e `classificados-data.ts` (CRUD do marketplace,
  moderação, WhatsApp helpers). `mocks.ts` só tem tipos/constantes de UI
  (`MONTH_NAMES_PT`, status labels) — os arrays de dados foram esvaziados de
  propósito quando o front migrou de mock pra Supabase real.

## Features de domínio

Votações/enquetes, reservas de espaços, financeiro, obras, documentos,
amenidades, **classificados** (marketplace), **visitantes**, **chamados**,
**mensagens externas** (contato público da landing), **criar-morador**
(cadastro pela síndica).

## Decisões e porquês

- **`admin.*` como prefixo de arquivo, não pasta**: mantém a árvore de rotas
  flat exigida pela convenção do TanStack Start file-based routing
  (`src/routes/README.md`).
- **`mocks.ts` ao lado de `portal-data.ts`**: vestígio proposital da migração
  front mockado → dados reais. Os tipos de UI ficaram e são reexportados por
  `portal-data.ts`; os arrays de dados foram esvaziados.
- **Dupla camada de erro (`start.ts` + `server.ts`)**: existe porque o h3
  engole certos throws antes do middleware normal ver — `server.ts` inspeciona
  a resposta e usa o buffer de `src/lib/error-capture.ts` pra recuperar o erro
  real e mostrar a página de fallback (`src/lib/error-page.ts`).
- **Error reporting via Lovable**: `src/lib/lovable-error-reporting.ts`
  chama `window.__lovableEvents.captureException(...)` quando embutido no
  ambiente Lovable (plataforma que hospeda/gera este projeto — ver
  `AGENTS.md`).
- **Segurança em `criar-morador`** (`supabase/functions/criar-morador/index.ts`):
  o design original confiava só no `service_role` sem validar o chamador
  (`verify_jwt=false`), permitindo escalação de privilégio — qualquer request
  anônima podia criar morador em qualquer `condominio_id`. Corrigido no commit
  `19db09f`: agora exige `Authorization`, valida `role` (`sindica`/
  `admin_agencia`) e que o `condominio_id` do chamador bata com o do payload,
  só então usa `service_role`. **Padrão a replicar** se novas edge functions
  privilegiadas forem criadas.
- **Single-tenant por design**: `LANDING_CONDOMINIO_ID` fixo
  (`src/lib/portal-data.ts:587`) é intencional, não uma limitação a remover.
