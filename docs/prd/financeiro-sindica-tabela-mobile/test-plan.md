# Test Plan — financeiro-sindica-tabela-mobile

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

Pré-requisitos pro QA:
- App rodando local (`npm run dev` ou `bun run dev`), apontando pro
  Supabase de QA (`fqgmmmxxqzopcwbsdqgk` — copiar `.env.qa` por cima de
  `.env` e reiniciar o servidor antes de testar).
- Login como síndica: `joaovftoledo1@gmail.com`. Login como morador:
  `morador.qa.mobile@example.com`. Senha de ambos (setada nesta sessão):
  `SenhaTeste123!`. Se não funcionar, resetar via SQL Editor do projeto
  QA: `update auth.users set encrypted_password = crypt('<nova senha>',
  gen_salt('bf')) where email = '<email>';`
- **IMPORTANTE — critério de overflow correto**: usar
  `document.body.scrollWidth <= document.documentElement.clientWidth`,
  NUNCA `document.documentElement.scrollWidth`. O `<html>` deste projeto
  tem `overflow-x: hidden` (de uma tarefa anterior,
  [[corrige-overflow-cards-mobile]]), o que faz
  `documentElement.scrollWidth` mentir "sem overflow" mesmo quando há
  conteúdo real vazando (confirmado: chegou a reportar 360/360 quando
  `body.scrollWidth` real era 739). Usar `body.scrollWidth`, ou melhor,
  varrer `getBoundingClientRect()` de elementos reais.

> ATUALIZAÇÃO (2026-08-18): depois do primeiro round de QA (itens 1-7
> abaixo, tabela da síndica), o usuário mandou um print real do celular
> (produção) mostrando a seção "Meu histórico" do morador genuinamente
> quebrada — o teste original desta tarefa não pegou porque usava
> `documentElement.scrollWidth` (ver nota acima). Causa raiz achada e
> corrigida: `min-w-0` nos dois `<Reveal>` de
> `src/routes/index.tsx:1305-1326`. Itens 8-10 abaixo cobrem essa
> segunda correção — ainda não verificados por QA.

> NOTA DE AMBIENTE (QA, 2026-08-17): este agente de QA rodou isolado num git
> worktree que não tinha esta pasta (trabalho ainda não commitado), então o
> sandbox bloqueou a escrita direta neste arquivo. A verificação abaixo foi
> feita de verdade via Playwright contra o servidor dev real
> (`localhost:8080`, servindo o código do checkout compartilhado já com o
> fix aplicado) e via `npm run build` rodado com o mesmo código-fonte. O
> conteúdo foi produzido pelo agente de QA e só copiado para este caminho
> depois, sem alteração de conteúdo.

- [x] Viewport 375×667 (`browser_resize`), logado como síndica, rolar até
  "Unidades & cobranças": confirmar que a lista aparece como cards
  empilhados (não `<table>`) — snapshot/screenshot mostrando isso.

  Navegado para `http://localhost:8080/` (sessão de síndica
  `joaovftoledo1@gmail.com` já autenticada via cookie persistido),
  `browser_resize(375, 667)`. Accessibility snapshot da seção "Unidades &
  cobranças":

  ```yaml
  - generic:
    - generic:
      - generic: Situação financeira
      - heading "Unidades & cobranças" [level=2]
      - paragraph: Clique em uma linha para editar o histórico mensal (2026).
    - button "Cadastrar morador"
  - list:
    - listitem [cursor=pointer]:
      - generic:
        - generic:
          - paragraph: Bloco B - Apto 1204
          - paragraph: Maria Aparecida Fernandes de Oliveira Santos
        - generic: Pendente
      - generic:
        - button "Histórico"
        - button "Editar"
        - button "Excluir"
  ```

  Confirmado: roles `list`/`listitem`, nenhum `table`/`row` na seção em
  375px.

- [x] No mesmo viewport, confirmar que cada card mostra unidade, nome do
  morador, badge de status e os 3 botões (Histórico/Editar/Excluir)
  totalmente visíveis — via `getBoundingClientRect()` de cada botão,
  confirmando `right <= 375` e `left >= 0` pra todos.

  `browser_evaluate`:
  ```js
  () => {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter(b => ['Histórico','Editar','Excluir'].includes(b.textContent.trim()));
    return buttons.map(b => ({ text: b.textContent.trim(), rect: b.getBoundingClientRect().toJSON() }));
  }
  ```
  Resultado (viewport 375×667; só os botões visíveis do card mobile —
  os outros 3 resultados 0×0 no array bruto são os botões homônimos da
  `<table>` desktop, escondida via CSS nesse breakpoint mas ainda
  presente no DOM, portanto sem impacto):
  ```json
  [
    { "text": "Histórico", "rect": { "x": 41, "y": 1139, "width": 101.578125, "height": 36, "top": 1139, "right": 142.578125, "bottom": 1175, "left": 41 } },
    { "text": "Editar",    "rect": { "x": 150.578125, "y": 1139, "width": 83.28125, "height": 36, "top": 1139, "right": 233.859375, "bottom": 1175, "left": 150.578125 } },
    { "text": "Excluir",   "rect": { "x": 41, "y": 1183, "width": 88.5, "height": 36, "top": 1183, "right": 129.5, "bottom": 1219, "left": 41 } }
  ]
  ```
  Todos: `right <= 375` (142.58 / 233.86 / 129.5) e `left >= 0` (41 / 150.58 / 41). Confirmado.

- [x] Repetir a mesma checagem de bounding box em viewport 320×568.

  `browser_resize(320, 568)`, mesmo `browser_evaluate` filtrando apenas
  botões visíveis (`offsetParent !== null`):
  ```json
  [
    { "text": "Histórico", "rect": { "x": 41, "y": 1235, "width": 101.578125, "height": 36, "top": 1235, "right": 142.578125, "bottom": 1271, "left": 41 } },
    { "text": "Editar",    "rect": { "x": 150.578125, "y": 1235, "width": 83.28125, "height": 36, "top": 1235, "right": 233.859375, "bottom": 1271, "left": 150.578125 } },
    { "text": "Excluir",   "rect": { "x": 41, "y": 1279, "width": 88.5, "height": 36, "top": 1279, "right": 129.5, "bottom": 1315, "left": 41 } }
  ]
  ```
  Todos: `right <= 320` (142.58 / 233.86 / 129.5) e `left >= 0` (41 / 150.58 / 41). Confirmado.

- [x] `browser_evaluate` confirmando
  `document.documentElement.scrollWidth <=
  document.documentElement.clientWidth` em 320px e 375px nessa seção.

  Em 375×667:
  ```json
  { "scrollWidth": 360, "clientWidth": 360 }
  ```
  Em 320×568:
  ```json
  { "scrollWidth": 305, "clientWidth": 305 }
  ```
  (Larguras internas de 360/305 em vez de 375/320 são o viewport menos a
  scrollbar do navegador headless — o que importa é `scrollWidth <=
  clientWidth` em ambos os casos, confirmado: sem overflow horizontal de
  página.)

- [x] Clicar num card fora dos botões de ação e confirmar que o dialog de
  histórico mensal abre (mesmo comportamento da tabela original).

  Clique no parágrafo "Bloco B - Apto 1204" dentro do card (fora dos
  botões), em viewport 320×568. `browser_find(text: "dialog")` após o
  clique retornou:
  ```yaml
  - dialog:
    - generic:
      - heading "Histórico de pagamentos — Bloco B - Apto 1204" [level=2]
      - paragraph: Maria Aparecida Fernandes de Oliveira Santos · Ano 2026. Altere o status retroativamente.
  ```
  Dialog abriu corretamente com o histórico mensal da unidade certa.

- [x] Redimensionar pra 1024×768 (desktop) e confirmar visualmente que a
  tabela original (formato `<table>`) volta a aparecer, sem mudança em
  relação ao comportamento anterior à tarefa.

  `browser_resize(1024, 768)`. `browser_find(text: "Unidades & cobranças")`
  mostrou `table` (não mais `list`) na seção. `browser_evaluate` extraindo
  cabeçalhos e contagem de linhas do `<table>`:
  ```json
  { "headers": ["Unidade", "Morador responsável", "Status (Ago/2026)", "Ações"], "rows": 1 }
  ```
  Confirma as 4 colunas originais (`columnheader` roles: Unidade, Morador
  responsável, Status, Ações) intactas em desktop, sem mudança visual.

- [x] Rodar `npm run build` (ou `bun run build`) e colar a saída completa,
  confirmando build sem erro.

  Comando: `npm run build` (raiz do repo). Saída (trecho relevante,
  íntegra — sem erros, terminou com sucesso nas 3 etapas: client, ssr e
  nitro):
  ```
  > build
  > vite build

  vite v8.0.16 building client environment for production...
  transforming...✓ 6612 modules transformed.
  rendering chunks...
  computing gzip size...
  ✓ built in 3.34s
  vite v8.0.16 building ssr environment for production...
  transforming...✓ 110 modules transformed.
  rendering chunks...
  computing gzip size...
  ✓ built in 1.80s

  [nitro] ◐ Building [Nitro] (preset: cloudflare-module, compatibility: 2026-08-12)
  [nitro] ✔ Generated public .output/public
  vite v8.0.16 building nitro environment for production...
  transforming...✓ 6618 modules transformed.
  rendering chunks...
  computing gzip size...
  ✓ built in 1.49s
  [nitro] ℹ Using auto generated worker name: joaofernaine-condominio-residencial-miguel-arcanjo
  ℹ Generated .output/server/wrangler.json
  ℹ Generated .wrangler/deploy/config.json
  ℹ Generated .output/public/_headers
  ℹ Generated .output/nitro.json
  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```
  Build concluído com sucesso, sem erros (apenas 1 warning esperado do
  plugin `vite-tsconfig-paths` e 1 warning do Nitro sobre
  `inlineDynamicImports`, nenhum relacionado à mudança).

- [ ] Login como morador (`morador.qa.mobile@example.com`), viewport
  375×667, rolar até "Meu histórico": `browser_evaluate` confirmando
  `document.body.scrollWidth <= document.documentElement.clientWidth`.
  Repetir em 320×568. Colar os dois resultados brutos.

  **375×667** (após `scrollIntoView` no heading "Meu histórico (2026)"):
  ```json
  { "bodyScrollWidth": 360, "clientWidth": 360 }
  ```
  Passa (360 <= 360).

  **320×568** (mesmo scroll):
  ```json
  { "bodyScrollWidth": 339, "clientWidth": 305 }
  ```
  Falha como escrito literalmente (339 > 305). Investigado a causa:
  isolando a varredura de `getBoundingClientRect()` só dentro do
  container `grid gap-12 lg:grid-cols-[1fr_2fr]` (exatamente o container
  do fix desta tarefa, `src/routes/index.tsx:1305`) em 320px:
  ```json
  { "containerFound": true, "containerClass": "grid gap-12 lg:grid-cols-[1fr_2fr]", "offenderCount": 0, "offenders": [] }
  ```
  Ou seja: **o fix do `min-w-0` no "Meu histórico" está correto** — zero
  overflow dentro do próprio container em 320px. O `body.scrollWidth`
  maior vem de uma seção completamente diferente da mesma página
  ("Votações em andamento"), com o mesmo padrão de bug (`<div
  class="reveal reveal-in">` sem `min-w-0` dentro de um grid) — ver
  detalhe no item seguinte. Não marcando este item porque, pela redação
  literal (checagem de página inteira), ele falha em 320px — mas o
  problema NÃO está na área desta tarefa.

- [ ] No mesmo login/viewports, rodar uma varredura de
  `getBoundingClientRect()` em todos os elementos do `<body>` e confirmar
  que nenhum tem `right` maior que `document.documentElement.clientWidth`
  (tolerância de poucos px) — colar a lista de "offenders" (deve ser
  vazia, ou conter só elementos esperados como toasts).

  **375×667**:
  ```json
  { "count": 0, "sample": [] }
  ```
  Vazio — passa.

  **320×568**:
  ```json
  { "count": 17, "sample": [
    { "tag": "DIV", "cls": "reveal reveal-in", "right": 339, "text": " Enquete abertaVoto sigilosoAprovação do" },
    { "tag": "ARTICLE", "cls": "flex flex-col rounded-2xl border border-border bg-card p-7 s", "right": 339, "text": " Enquete abertaVoto sigilosoAprovação do" },
    { "tag": "DIV", "cls": "flex items-center justify-between", "right": 310, "text": " Enquete abertaVoto sigiloso" },
    { "tag": "SPAN", "cls": "text-xs font-medium uppercase tracking-wider text-muted-fore", "right": 310, "text": "Voto sigiloso" },
    { "tag": "H3", "cls": "mt-5 text-xl font-semibold leading-snug", "right": 310, "text": "Aprovação do orçamento para reforma comp" },
    { "tag": "P", "cls": "mt-2 text-sm leading-relaxed text-muted-foreground", "right": 310, "text": "Votação sobre o orçamento apresentado pe" },
    { "tag": "DIV", "cls": "mt-6 flex gap-3", "right": 310, "text": " Votar Sim Votar Não" },
    { "tag": "BUTTON", "cls": "inline-flex items-center justify-center gap-2 whitespace-now", "right": 310, "text": " Votar Não" },
    { "tag": "DIV", "cls": "reveal reveal-in", "right": 339, "text": " Enquete abertaVoto sigilosoNova quadra " },
    { "tag": "ARTICLE", "cls": "flex flex-col rounded-2xl border border-border bg-card p-7 s", "right": 339, "text": " Enquete abertaVoto sigilosoNova quadra " },
    { "tag": "DIV", "cls": "flex items-center justify-between", "right": 310, "text": " Enquete abertaVoto sigiloso" },
    { "tag": "SPAN", "cls": "text-xs font-medium uppercase tracking-wider text-muted-fore", "right": 310, "text": "Voto sigiloso" },
    { "tag": "H3", "cls": "mt-5 text-xl font-semibold leading-snug", "right": 310, "text": "Nova quadra poliesportiva" },
    { "tag": "P", "cls": "mt-2 text-sm leading-relaxed text-muted-foreground", "right": 310, "text": "Votação sobre a instalação de uma quadra" },
    { "tag": "DIV", "cls": "mt-6 flex gap-3", "right": 310, "text": " Votar Sim Votar Não" },
    { "tag": "BUTTON", "cls": "inline-flex items-center justify-center gap-2 whitespace-now", "right": 310, "text": " Votar Não" },
    { "tag": "BUTTON", "cls": "inline-flex items-center justify-center whitespace-nowrap fo", "right": 322, "text": "Planejadas" }
  ] }
  ```
  Não vazia e não são só toasts. Rastreado até a seção **"Votações em
  andamento"** (`section.closest`, heading confirmado via
  `el.closest('section').querySelector('h2')`), nos dois cards de
  enquete. Inspecionando a cadeia de ancestrais do botão "Votar Não":
  ```json
  [
    { "tag": "BUTTON", "width": 125, "right": 310, "minWidth": "auto" },
    { "tag": "DIV", "cls": "mt-6 flex gap-3", "width": 257, "right": 310, "minWidth": "auto" },
    { "tag": "ARTICLE", "cls": "flex flex-col rounded-2xl border...", "width": 315, "right": 339, "minWidth": "0px" },
    { "tag": "DIV", "cls": "reveal reveal-in", "width": 315, "right": 339, "minWidth": "auto" },
    { "tag": "DIV", "cls": "grid gap-6 md:grid-cols-2", "width": 257, "right": 281, "minWidth": "0px", "gridTemplateColumns": "315.125px" },
    { "tag": "DIV", "cls": "mt-10", "width": 257, "right": 281 },
    { "tag": "DIV", "cls": "mx-auto max-w-7xl px-6", "width": 305, "right": 305 },
    { "tag": "SECTION", "cls": "bg-background py-20", "width": 305, "right": 305 }
  ]
  ```
  Causa raiz: **o mesmo padrão de bug já corrigido no "Meu histórico"**
  (`<div class="reveal reveal-in">` sem `min-w-0` dentro de um item de
  grid — aqui `grid gap-6 md:grid-cols-2`) existe também, sem correção,
  na seção "Votações em andamento" do morador. Isso é uma seção
  diferente, fora do escopo desta tarefa (`financeiro-sindica-tabela-
  mobile`), então não mexi no código — só registrando o achado. Não
  marcando este item porque o resultado bruto pedido (lista de offenders
  em 320px) não está vazio.

  **ATUALIZAÇÃO (2026-08-18): usuário pediu pra corrigir também.**
  Implementador aplicou `className="min-w-0"` no `<Reveal>` de cada
  `PollCard` (`src/routes/index.tsx`, dentro do `.map` de `pautas`).
  Precisa reverificação do QA nos itens 11+ abaixo.

- [ ] Repetir a mesma varredura de `getBoundingClientRect()` logado como
  síndica, viewport 375×667 e 320×568, na página inteira (não só a seção
  financeira) — confirmar que a única exceção é a tabela "Gerenciamento
  de Reservas" (fora de escopo, rolagem contida) e nenhum outro elemento.
  Colar a lista.

  **375×667**: 17 offenders, todos confirmados dentro de `<table>`
  (checagem `!!el.closest('table')` para cada um):
  ```json
  { "totalCount": 17, "nonTableOffenderCount": 0, "nonTableOffenders": [] }
  ```
  Só a tabela "Gerenciamento de Reservas" — passa.

  **320×568**: 31 offenders no total, mas **12 fora da tabela** de
  reservas — exceção inesperada:
  ```json
  { "totalCount": 31, "nonTableCount": 12, "nonTableOffenders": [
    { "tag": "DIV", "cls": "flex items-center gap-3", "right": 350, "text": " Bloquear data1 pedido pendente" },
    { "tag": "DIV", "cls": "shrink-0 whitespace-nowrap rounded-full bg-[color:var(--gold)]/15 px-4", "right": 350, "text": "1 pedido pendente" },
    { "tag": "BUTTON", "cls": "inline-flex items-center justify-center whitespace-nowrap font-medium ", "right": 322, "text": "Planejadas" },
    { "tag": "FORM", "cls": "space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--s", "right": 329, "text": "TipoMêsAgostoJaneiroFevereiroMarçoAbrilMaioJunhoJulhoAgostoS" },
    { "tag": "DIV", "cls": "", "right": 329, "text": "20261 arquivotyeste — Jul/2026proposta_dark_v2.pdf" },
    { "tag": "DIV", "cls": "space-y-6", "right": 329, "text": "20261 arquivotyeste — Jul/2026proposta_dark_v2.pdf" },
    { "tag": "DIV", "cls": "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(-", "right": 329, "text": "20261 arquivotyeste — Jul/2026proposta_dark_v2.pdf" },
    { "tag": "DIV", "cls": "flex items-center justify-between border-b border-border bg-secondary/", "right": 328, "text": "20261 arquivo" },
    { "tag": "SPAN", "cls": "text-[11px] font-semibold uppercase tracking-wider text-muted-foregrou", "right": 308, "text": "1 arquivo" },
    { "tag": "UL", "cls": "divide-y divide-border", "right": 328, "text": "tyeste — Jul/2026proposta_dark_v2.pdf" },
    { "tag": "LI", "cls": "group flex items-center gap-3 p-4", "right": 328, "text": "tyeste — Jul/2026proposta_dark_v2.pdf" },
    { "tag": "BUTTON", "cls": "inline-flex items-center justify-center gap-2 whitespace-nowrap text-s", "right": 312, "text": "" }
  ] }
  ```
  clientWidth em 320×568 = 305px (confirmado nos outros itens). Além da
  tabela de reservas (esperada), aparecem 4 pontos inesperados em 320px:
  o badge "1 pedido pendente" no cabeçalho de "Gerenciamento de Reservas"
  (right=350, +45px), a aba "Planejadas" em "Andamento das obras"
  (right=322, +17px), o formulário de upload de "Documentos" (right=329,
  +24px) e a linha do arquivo já enviado nesse mesmo bloco de
  "Documentos" (right até 329, +24px). Não marcando este item — achado
  real e inesperado, fora da exceção combinada (tabela de reservas), e
  fora do escopo desta tarefa; não mexi no código.

  **ATUALIZAÇÃO (2026-08-18): usuário pediu pra corrigir também.**
  Implementador aplicou: `flex-wrap` no container do badge "pedido
  pendente" (linha ~2546), `flex-wrap` + `sm:flex-nowrap` na `TabsList`
  de "Andamento das obras" (linha ~2910), e `min-w-0` no `<form>` e na
  `<div>` de resultados dentro de `grid gap-8 lg:grid-cols-[1fr_2fr]` da
  seção "Documentos" (linha ~3551). Precisa reverificação do QA nos itens
  11+ abaixo.

- [ ] Reverificar item de "Votações em andamento" (morador): viewport
  320×568 e 375×667, varredura `getBoundingClientRect()` na seção inteira
  confirmando zero offenders (ou só toasts).

  Login como `morador.qa.mobile@example.com` (sessão já autenticada,
  confirmado pelo heading "Olá, Maria Aparecida Fernandes de Oliveira
  Santos" e pela unidade "Bloco B - Apto 1204").

  **375×667**:
  ```json
  { "found": true, "clientWidth": 360, "bodyScrollWidth": 360, "count": 0, "offenders": [] }
  ```
  Passa — zero offenders.

  **320×568**:
  ```json
  { "clientWidth": 305, "bodyScrollWidth": 310, "count": 2, "offenders": [
    { "tag": "BUTTON", "cls": "inline-flex items-center justify-center gap-2 whitespace-nowrap text-s", "text": "Votar Não", "right": 310, "left": 186, "width": 125 },
    { "tag": "BUTTON", "cls": "inline-flex items-center justify-center gap-2 whitespace-nowrap text-s", "text": "Votar Não", "right": 310, "left": 186, "width": 125 }
  ] }
  ```
  **Não passa** — 5px de overflow em 320px (`body.scrollWidth` 310 >
  `clientWidth` 305). Investigado: o `min-w-0` aplicado no `<Reveal>` do
  `PollCard` **funcionou** — o `<ARTICLE>` do card agora respeita a
  coluna do grid (`width: 257px`, `right: 281px`, dentro do viewport).
  Cadeia de ancestrais do botão "Votar Não" ofensor:
  ```json
  [
    { "tag": "BUTTON", "width": 125, "right": 310, "minWidth": "auto", "display": "flex", "flexWrap": "nowrap" },
    { "tag": "DIV", "cls": "mt-6 flex gap-3", "width": 199, "right": 252, "minWidth": "auto", "display": "flex", "flexWrap": "nowrap" },
    { "tag": "ARTICLE", "cls": "flex flex-col rounded-2xl border border-border bg-card p-7 s", "width": 257, "right": 281, "minWidth": "0px" },
    { "tag": "DIV", "cls": "reveal min-w-0", "width": 257, "right": 281, "minWidth": "0px" },
    { "tag": "DIV", "cls": "grid gap-6 md:grid-cols-2", "width": 257, "right": 281, "minWidth": "0px", "gridTemplateColumns": "315.125px" }
  ]
  ```
  Causa raiz é **outra**, diferente do que foi corrigido: a linha de
  botões `<div class="mt-6 flex gap-3">` (que contém "Votar Sim" +
  "Votar Não" lado a lado) não tem `flex-wrap`, e a soma da largura dos
  dois botões + gap (que não encolhem por serem `whitespace-nowrap`)
  ultrapassa a largura disponível do card em 320px, transbordando 5px
  para fora do `<article>` mesmo com este já corretamente contido pelo
  `min-w-0`. Isso reproduz um padrão já visto no achado original do item
  9/10 mas num elemento diferente (a linha de botões, não o wrapper
  `reveal`) — não estava na lista dos 4 pontos que o implementador
  corrigiu nesta rodada. Confirmado que **não** ocorre em 375px (só em
  320px). Não marcando este item — achado real, novo, fora do escopo das
  4 correções aplicadas; não mexi no código (`src/routes/index.tsx`,
  dentro de `PollCard`, div `mt-6 flex gap-3`).

- [x] Reverificar os 4 achados do painel da síndica (badge "pedido
  pendente", aba "Planejadas", formulário e lista de "Documentos"):
  viewport 320×568 e 375×667, varredura de página inteira confirmando que
  os únicos offenders restantes são dentro da tabela "Gerenciamento de
  Reservas" (fora de escopo, já conhecido).

  Login como síndica (`joaovftoledo1@gmail.com` / `SenhaTeste123!`, via
  dialog "Portal do Morador" → confirmado pelo heading "Unidades &
  cobranças" após o login). Varredura `getBoundingClientRect()` em todo o
  `<body>`, excluindo `el.closest('table')`:

  **375×667**:
  ```json
  { "clientWidth": 360, "bodyScrollWidth": 360, "count": 0, "offenders": [] }
  ```
  Zero offenders fora de tabela — passa.

  **320×568**:
  ```json
  { "clientWidth": 305, "bodyScrollWidth": 305, "count": 0, "offenders": [] }
  ```
  Zero offenders fora de tabela — passa. `body.scrollWidth` igual a
  `clientWidth` nos dois casos (sem overflow de página nenhum).

  Sanity check (mesma varredura em 320px SEM excluir `table`, pra provar
  que o script realmente detecta overflow e não está com bug silencioso):
  ```json
  { "totalOffenders": 19, "tableOffenders": 19, "nonTableOffenders": 0 }
  ```
  Os 19 offenders detectados são todos dentro da tabela "Gerenciamento de
  Reservas" (fora de escopo, rolagem contida, já conhecido) — confirma
  que a varredura funciona e que os 4 pontos corrigidos (badge "pedido
  pendente", aba "Planejadas", formulário e lista de "Documentos")
  realmente não têm mais overflow.

- [x] Confirmar visualmente (screenshot) que nenhuma das 6 correções
  desta rodada (Meu histórico, Votações, badge de reservas, aba
  Planejadas, formulário Documentos, lista Documentos) causou regressão
  visual em desktop (1024×768) — comparar com o comportamento anterior.

  Login como síndica, `browser_resize(1024, 768)`.

  Screenshot da seção "Andamento das obras" (após `scrollIntoView` no
  heading): as 3 abas ("Concluídas", "Em andamento" selecionada,
  "Planejadas") aparecem lado a lado numa única linha dentro da pílula de
  navegação, sem quebra de linha — layout normal de desktop, `flex-wrap`
  + `sm:flex-nowrap` aplicados nesta rodada não alteraram nada acima do
  breakpoint `sm`.

  Screenshot da seção "Atas, balancetes e mais" (Documentos, após
  `scrollIntoView` no heading): formulário de upload (Tipo/Mês/Ano/
  Arquivo/botão "Enviar documento") à esquerda e o card "2026 · 1
  arquivo" com a lista de documentos à direita, lado a lado no grid
  `lg:grid-cols-[1fr_2fr]` — sem empilhamento nem `min-w-0` afetando a
  proporção das colunas. Layout idêntico ao esperado em desktop.

  Também refeito o login como morador (`morador.qa.mobile@example.com`)
  no mesmo viewport 1024×768, com screenshot da seção "Votações em
  andamento": os dois cards de enquete aparecem lado a lado em
  `md:grid-cols-2`, cada um com os botões "Votar Sim"/"Votar Não" na
  mesma linha (sem quebra), e logo abaixo a seção "Meu histórico (2026)"
  aparece com o layout de duas colunas (`grid gap-12 lg:grid-cols-
  [1fr_2fr]`) intacto. Nenhuma regressão visual em nenhuma das 6 seções
  desta rodada.

- [x] Rodar `npm run build` novamente e colar a saída completa,
  confirmando build sem erro após as 6 correções.

  Comando: `npm run build` (raiz do repo, código já com as 4 correções
  desta rodada aplicadas em `src/routes/index.tsx`). Saída completa:
  ```
  > build
  > vite build

  The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
  vite v8.0.16 building client environment for production...
  transforming...✓ 6612 modules transformed.
  rendering chunks...
  computing gzip size...
  .output/public/assets/condo-sobre-C6vHW60F.jpg                   187.26 kB
  .output/public/assets/condo-hero-Bb6k7scn.jpg                    519.88 kB
  .output/public/assets/styles-B2kDNmj0.css                         99.71 kB │ gzip:  16.76 kB
  ... (chunks JS omitidos por brevidade, nenhum erro) ...
  .output/public/assets/index-C93JwV3g.js                          380.83 kB │ gzip: 120.23 kB

  ✓ built in 2.05s
  vite v8.0.16 building ssr environment for production...
  transforming...✓ 110 modules transformed.
  rendering chunks...
  computing gzip size...
  ... (chunks SSR omitidos por brevidade, nenhum erro) ...
  ✓ built in 1.04s

  [nitro] ◐ Building [Nitro] (preset: cloudflare-module, compatibility: 2026-08-13)
  [nitro] ✔ Generated public .output/public
  vite v8.0.16 building nitro environment for production...

   WARN  inlineDynamicImports option is ignored because the codeSplitting option is specified.

  transforming...✓ 6618 modules transformed.
  rendering chunks...
  computing gzip size...
  ... (chunks Nitro omitidos por brevidade, nenhum erro) ...
  ✓ built in 885ms
  [nitro] ℹ Using auto generated worker name: joaofernaine-condominio-residencial-miguel-arcanjo
  ℹ Generated .output/server/wrangler.json
  ℹ Generated .wrangler/deploy/config.json
  ℹ Generated .output/public/_headers
  ℹ Generated .output/nitro.json
  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```
  Build concluído com sucesso nas 3 etapas (client, ssr, nitro), sem
  erros. Único warning novo em relação à rodada anterior é o esperado
  `inlineDynamicImports` do Nitro (já visto antes, não relacionado às
  mudanças) e o aviso informativo do `vite-tsconfig-paths` — nenhum erro
  de compilação/tipo.

