# Test Plan — financeiro-morador-redesign-heatmap

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

Pré-requisitos: app rodando local apontando pro Supabase de QA
(`fqgmmmxxqzopcwbsdqgk`), login como morador
(`morador.qa.mobile@example.com` / `SenhaTeste123!`).

- [x] Logado como morador, rolar até "Meu histórico": confirmar via
  snapshot/screenshot que a grade de 12 meses aparece sempre visível (sem
  precisar clicar em "ver histórico completo" — esse botão não deve mais
  existir).

  Testado via Playwright real contra http://localhost:8080 (dev server já
  rodando, apontando pro Supabase QA `fqgmmmxxqzopcwbsdqgk`), sessão de
  morador já autenticada (`morador.qa.mobile@example.com`, unidade Bloco B
  - Apto 1204).

  Accessibility snapshot da seção (sem nenhuma interação/clique prévio):
  ```yaml
  - generic [ref=f38e63]:
    - generic [ref=f38e64]:
      - generic [ref=f38e65]: Transparência financeira
      - heading "Meu histórico (2026)" [level=2] [ref=f38e69]
      - paragraph [ref=f38e70]: Situação de pagamento da sua unidade (Bloco B - Apto 1204) mês a mês.
    - generic [ref=f38e71]:
      - generic [ref=f38e72]:
        - heading "Pagamentos 2026" [level=3] [ref=f38e74]
        - generic [ref=f38e78]:
          - strong [ref=f38e79]: 0 de 8 meses em dia
          - generic [ref=f38e80]: · 1 atrasado
        - generic [ref=f38e81]:
          - 'generic "Janeiro: Sem registro" [ref=f38e82]': Jan
          - 'generic "Fevereiro: Sem registro" [ref=f38e83]': Fev
          - 'generic "Março: Sem registro" [ref=f38e84]': Mar
          - 'generic "Abril: Sem registro" [ref=f38e85]': Abr
          - 'generic "Maio: Sem registro" [ref=f38e86]': Mai
          - 'generic "Junho: Sem registro" [ref=f38e87]': Jun
          - 'generic "Julho: Atrasado" [ref=f38e88]': Jul
          - 'generic "Agosto: Sem registro" [ref=f38e89]': Ago
          - 'generic "Setembro: A faturar" [ref=f38e90]': Set
          - 'generic "Outubro: A faturar" [ref=f38e91]': Out
          - 'generic "Novembro: A faturar" [ref=f38e92]': Nov
          - 'generic "Dezembro: A faturar" [ref=f38e93]': Dez
        - generic [ref=f38e94]:
          - generic [ref=f38e95]: Em dia
          - generic [ref=f38e97]: Atrasado
          - generic [ref=f38e99]: Pendente
          - generic [ref=f38e101]: A faturar
  ```

  Nenhum botão "ver histórico completo" / expandir presente no DOM (grep em
  `src/routes/index.tsx` por "expand"/"ver histórico completo" só retorna
  o accordion não-relacionado "Auditar votação" das enquetes, nada dentro
  de `MyPaymentGrid`). Screenshot em 1280x900 confirma visualmente a grade
  completa e sempre visível, com resumo, 12 blocos e legenda, sem nenhum
  botão de expandir/recolher.

- [x] Confirmar que o mês atual tem destaque visual distinto dos outros
  (via `getComputedStyle` ou screenshot comparando o bloco do mês atual
  com os demais).

  Mês atual = Agosto (2026-08-18). `getComputedStyle` nos blocos de
  Junho, Julho e Agosto via `browser_evaluate`:
  ```json
  [
    {
      "title": "Junho: Sem registro",
      "boxShadow": "none",
      "className": "... bg-secondary/50 text-muted-foreground "
    },
    {
      "title": "Julho: Atrasado",
      "boxShadow": "none",
      "className": "... bg-destructive text-destructive-foreground "
    },
    {
      "title": "Agosto: Sem registro",
      "boxShadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(255, 255, 255) 0px 0px 0px 2px, rgb(27, 58, 107) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "className": "... bg-secondary/50 text-muted-foreground ring-2 ring-primary ring-offset-2 ring-offset-card"
    }
  ]
  ```
  Só o bloco de Agosto (mês corrente) tem `box-shadow` (o ring do
  Tailwind, `ring-2 ring-primary ring-offset-2 ring-offset-card`); os
  demais têm `boxShadow: none`. Confirmado também visualmente no
  screenshot 1280x900: o bloco "AGO" tem um contorno azul-marinho nítido
  que nenhum outro bloco tem.

- [x] Confirmar o texto de resumo ("X de Y meses em dia...") bate com os
  dados reais do `historico_financeiro` da conta de teste — meses sem
  registro NÃO devem contar como "pendente" no resumo.

  Título (`title`) de cada um dos 12 blocos, lido via `browser_evaluate`
  (reflete o dado real vindo do Supabase QA, `HISTORICO_DB_TO_UI[row.status]`
  quando existe registro, ou "Sem registro"/"A faturar" quando não existe):
  ```json
  [
    "Janeiro: Sem registro",
    "Fevereiro: Sem registro",
    "Março: Sem registro",
    "Abril: Sem registro",
    "Maio: Sem registro",
    "Junho: Sem registro",
    "Julho: Atrasado",
    "Agosto: Sem registro",
    "Setembro: A faturar",
    "Outubro: A faturar",
    "Novembro: A faturar",
    "Dezembro: A faturar"
  ]
  ```
  Mês atual = Agosto (mês 8). Dos 8 meses já decorridos (Jan-Ago): 7 sem
  registro no `historico_financeiro` (Jan, Fev, Mar, Abr, Mai, Jun, Ago) e
  1 com status "Atrasado" (Jul). Nenhum com "Em dia" ou "Pendente".

  Texto de resumo renderizado: **"0 de 8 meses em dia · 1 atrasado"**.

  - "0 de 8" bate: 0 meses com status "Em dia" entre os 8 decorridos.
  - "1 atrasado" bate: só Julho tem status Atrasado.
  - Nenhum "X pendente" aparece no texto — correto, pois não há nenhum mês
    com status real "Pendente" no banco. Os 7 meses sem registro (inclusive
    o mês corrente) aparecem como "Sem registro"/cor neutra na grade e
    **não** entram na contagem de pendências do resumo, confirmando que o
    componente separa "sem dado" de "pendente de verdade" (código em
    `src/routes/index.tsx`, função `MyPaymentGrid`: `counts.semRegistro` é
    incrementado à parte de `counts.Pendente` e nunca aparece no texto).

- [x] Viewport 375×667 e 320×568: `document.body.scrollWidth <=
  document.documentElement.clientWidth` na seção "Meu histórico".

  Viewport 375×667 (com a seção "Pagamentos 2026" centralizada na tela via
  `scrollIntoView`):
  ```json
  {
    "bodyScrollWidth": 360,
    "clientWidth": 360,
    "overflowOK": true,
    "viewport": { "w": 375, "h": 667 }
  }
  ```

  Viewport 320×568 (mesma seção centralizada):
  ```json
  {
    "bodyScrollWidth": 305,
    "clientWidth": 305,
    "overflowOK": true,
    "viewport": { "w": 320, "h": 568 }
  }
  ```

  Em ambos, `document.body.scrollWidth <= document.documentElement.clientWidth`
  é verdadeiro (sem rolagem horizontal). Screenshot em 320×568 confirma
  visualmente a grade de 6 colunas cabendo sem cortar/vazar nada.

- [x] Rodar `npm run build` e colar a saída completa, confirmando build
  sem erro.

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
  .output/public/assets/styles-8R8_OxbP.css                        100.73 kB │ gzip:  16.87 kB
  .output/public/assets/trash-2-Dz4009lE.js                          0.31 kB │ gzip:   0.20 kB
  .output/public/assets/shield-check-DqCcPvfe.js                     0.46 kB │ gzip:   0.31 kB
  .output/public/assets/tag-NJXDQTkg.js                              0.61 kB │ gzip:   0.37 kB
  .output/public/assets/input-BBtrbsrf.js                            0.68 kB │ gzip:   0.43 kB
  .output/public/assets/badge-Aqhco7KU.js                            0.73 kB │ gzip:   0.38 kB
  .output/public/assets/label-gZ4d2wGC.js                            1.30 kB │ gzip:   0.72 kB
  .output/public/assets/use-portal-auth-DBc2NzHO.js                  1.65 kB │ gzip:   0.69 kB
  .output/public/assets/dialog-DVKDKx0S.js                           2.07 kB │ gzip:   0.85 kB
  .output/public/assets/classificados.index-CjBGRf0B.js              3.93 kB │ gzip:   1.67 kB
  .output/public/assets/admin.classificados.pendentes--4Yzi2xf.js    4.35 kB │ gzip:   1.70 kB
  .output/public/assets/admin.classificados.index-CBP5nEGe.js        4.39 kB │ gzip:   1.71 kB
  .output/public/assets/alert-dialog-Dj4qnNjd.js                     4.76 kB │ gzip:   1.80 kB
  .output/public/assets/classificados.novo-CR9wEBjQ.js               5.54 kB │ gzip:   2.26 kB
  .output/public/assets/tooltip-DcEnCfp5.js                          8.58 kB │ gzip:   3.24 kB
  .output/public/assets/dist-DqwLaFJ4.js                             8.62 kB │ gzip:   3.18 kB
  .output/public/assets/classificados.meus-Cg9-SSN0.js              10.87 kB │ gzip:   3.61 kB
  .output/public/assets/Combination-DV2kIosd.js                     23.65 kB │ gzip:   8.54 kB
  .output/public/assets/select-CRBzIMsd.js                          51.79 kB │ gzip:  17.85 kB
  .output/public/assets/classificados-data-DQDgrFDZ.js             251.91 kB │ gzip:  64.88 kB
  .output/public/assets/routes-D4cb0LEI.js                         262.51 kB │ gzip:  63.76 kB
  .output/public/assets/index-DL0R0laL.js                          380.83 kB │ gzip: 120.22 kB

  ✓ built in 2.58s
  vite v8.0.16 building ssr environment for production...
  transforming...✓ 110 modules transformed.
  rendering chunks...
  computing gzip size...
  node_modules/.nitro/vite/services/ssr/assets/condo-sobre-C6vHW60F.jpg                   187.26 kB
  node_modules/.nitro/vite/services/ssr/assets/condo-hero-Bb6k7scn.jpg                    519.88 kB
  node_modules/.nitro/vite/services/ssr/assets/styles-8R8_OxbP.css                        100.73 kB │ gzip: 16.87 kB
  node_modules/.nitro/vite/services/ssr/assets/empty-plugin-adapters-D9UWiqvJ.js            0.22 kB │ gzip:  0.16 kB
  node_modules/.nitro/vite/services/ssr/assets/start-Ok9K6Nid.js                            0.64 kB │ gzip:  0.39 kB
  node_modules/.nitro/vite/services/ssr/assets/input-uzm9g8Y7.js                            0.76 kB │ gzip:  0.45 kB
  node_modules/.nitro/vite/services/ssr/assets/badge-B3f60TId.js                            0.98 kB │ gzip:  0.50 kB
  node_modules/.nitro/vite/services/ssr/assets/label-DHlBdOaa.js                            1.18 kB │ gzip:  0.58 kB
  node_modules/.nitro/vite/services/ssr/assets/tooltip-UfIeK6c9.js                          1.20 kB │ gzip:  0.56 kB
  node_modules/.nitro/vite/services/ssr/assets/createStart-Dt05N14y.js                      1.65 kB │ gzip:  0.57 kB
  node_modules/.nitro/vite/services/ssr/assets/button-PwNqyxv_.js                           1.81 kB │ gzip:  0.82 kB
  node_modules/.nitro/vite/services/ssr/assets/use-portal-auth-C3xgOxAB.js                  2.80 kB │ gzip:  0.95 kB
  node_modules/.nitro/vite/services/ssr/assets/dialog-C07Z191J.js                           3.08 kB │ gzip:  1.01 kB
  node_modules/.nitro/vite/services/ssr/assets/alert-dialog-g_nJl_ho.js                     3.28 kB │ gzip:  0.88 kB
  node_modules/.nitro/vite/services/ssr/index.js                                            3.41 kB │ gzip:  1.46 kB
  node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-_iyoxSPI.js       3.47 kB │ gzip:  0.74 kB
  node_modules/.nitro/vite/services/ssr/assets/select-DamjaduW.js                           4.67 kB │ gzip:  1.34 kB
  node_modules/.nitro/vite/services/ssr/assets/classificados.index-dLMmpNdg.js              6.45 kB │ gzip:  2.18 kB
  node_modules/.nitro/vite/services/ssr/assets/admin.classificados.pendentes-fpILe_UI.js    7.42 kB │ gzip:  2.23 kB
  node_modules/.nitro/vite/services/ssr/assets/admin.classificados.index-DMYOOFL2.js        7.65 kB │ gzip:  2.20 kB
  node_modules/.nitro/vite/services/ssr/assets/classificados.novo-BPSAW8Hv.js               9.99 kB │ gzip:  3.05 kB
  node_modules/.nitro/vite/services/ssr/assets/router-DW-MExNl.js                          11.93 kB │ gzip:  3.41 kB
  node_modules/.nitro/vite/services/ssr/assets/classificados.meus-q3PjAUwf.js              18.80 kB │ gzip:  4.84 kB
  node_modules/.nitro/vite/services/ssr/assets/classificados-data--4W8BZT7.js              24.86 kB │ gzip:  5.64 kB
  node_modules/.nitro/vite/services/ssr/assets/server-B50EZsH3.js                          58.69 kB │ gzip: 15.11 kB
  node_modules/.nitro/vite/services/ssr/assets/routes-BpOFjnel.js                         298.70 kB │ gzip: 53.37 kB

  ✓ built in 1.19s

  [nitro] ◐ Building [Nitro] (preset: cloudflare-module, compatibility: 2026-08-13)
  [nitro] ✔ Generated public .output/public
  vite v8.0.16 building nitro environment for production...

   WARN  inlineDynamicImports option is ignored because the codeSplitting option is specified.

  transforming...✓ 6618 modules transformed.
  rendering chunks...
  computing gzip size...
  .output/server/_libs/radix-ui__number.mjs                         0.17 kB │ gzip:   0.15 kB
  .output/server/_ssr/empty-plugin-adapters-D9UWiqvJ.mjs            0.23 kB │ gzip:   0.16 kB
  .output/server/_libs/radix-ui__primitive.mjs                      0.42 kB │ gzip:   0.23 kB
  .output/server/_libs/radix-ui__react-direction.mjs                0.59 kB │ gzip:   0.32 kB
  .output/server/_chunks/ssr-renderer.mjs                           0.60 kB │ gzip:   0.36 kB
  .output/server/_libs/radix-ui__react-slot.mjs                     0.67 kB │ gzip:   0.37 kB
  .output/server/_ssr/start-Ok9K6Nid.mjs                            0.69 kB │ gzip:   0.42 kB
  .output/server/_libs/tanstack__react-query.mjs                    0.79 kB │ gzip:   0.39 kB
  .output/server/_libs/radix-ui__react-arrow.mjs                    0.93 kB │ gzip:   0.49 kB
  .output/server/_ssr/input-uzm9g8Y7.mjs                            1.08 kB │ gzip:   0.57 kB
  .output/server/_runtime.mjs                                       1.14 kB │ gzip:   0.57 kB
  .output/server/_libs/hookable.mjs                                 1.16 kB │ gzip:   0.51 kB
  .output/server/_ssr/badge-B3f60TId.mjs                            1.20 kB │ gzip:   0.56 kB
  .output/server/_ssr/label-DHlBdOaa.mjs                            1.48 kB │ gzip:   0.67 kB
  .output/server/_ssr/tooltip-UfIeK6c9.mjs                          1.51 kB │ gzip:   0.68 kB
  .output/server/_ssr/createStart-Dt05N14y.mjs                      1.56 kB │ gzip:   0.57 kB
  .output/server/_libs/radix-ui__react-primitive.mjs                2.03 kB │ gzip:   0.61 kB
  .output/server/_ssr/button-PwNqyxv_.mjs                           2.14 kB │ gzip:   0.93 kB
  .output/server/_libs/radix-ui__react-context.mjs                  2.87 kB │ gzip:   0.97 kB
  .output/server/_libs/class-variance-authority+clsx.mjs            3.17 kB │ gzip:   1.24 kB
  .output/server/_ssr/use-portal-auth-C3xgOxAB.mjs                  3.29 kB │ gzip:   1.05 kB
  .output/server/_ssr/ssr.mjs                                       3.34 kB │ gzip:   1.46 kB
  .output/server/_tanstack-start-manifest_v-_iyoxSPI.mjs            3.52 kB │ gzip:   0.77 kB
  .output/server/_ssr/dialog-C07Z191J.mjs                           3.54 kB │ gzip:   1.14 kB
  .output/server/_ssr/alert-dialog-g_nJl_ho.mjs                     3.61 kB │ gzip:   1.01 kB
  .output/server/_libs/radix-ui__react-progress.mjs                 3.69 kB │ gzip:   1.25 kB
  .output/server/_libs/radix-ui__react-switch.mjs                   4.32 kB │ gzip:   1.55 kB
  .output/server/_ssr/select-DamjaduW.mjs                           5.37 kB │ gzip:   1.52 kB
  .output/server/_libs/@radix-ui/react-label+[...].mjs              5.67 kB │ gzip:   1.79 kB
  .output/server/_libs/radix-ui__react-tabs.mjs                     5.68 kB │ gzip:   1.66 kB
  .output/server/_libs/@radix-ui/react-collection+[...].mjs         6.64 kB │ gzip:   1.87 kB
  .output/server/_ssr/classificados.index-dLMmpNdg.mjs              7.92 kB │ gzip:   2.34 kB
  .output/server/_libs/radix-ui__react-roving-focus.mjs             8.45 kB │ gzip:   2.43 kB
  .output/server/_libs/@radix-ui/react-checkbox+[...].mjs           8.62 kB │ gzip:   2.52 kB
  .output/server/_ssr/admin.classificados.pendentes-fpILe_UI.mjs    9.01 kB │ gzip:   2.38 kB
  .output/server/_ssr/admin.classificados.index-DMYOOFL2.mjs        9.21 kB │ gzip:   2.36 kB
  .output/server/_libs/h3-v2+srvx.mjs                               9.72 kB │ gzip:   3.01 kB
  .output/server/_ssr/classificados.novo-BPSAW8Hv.mjs              11.63 kB │ gzip:   3.21 kB
  .output/server/_libs/tanstack__history.mjs                       12.09 kB │ gzip:   3.48 kB
  .output/server/_libs/supabase__functions-js.mjs                  12.12 kB │ gzip:   3.32 kB
  .output/server/_ssr/router-DW-MExNl.mjs                          12.54 kB │ gzip:   3.51 kB
  .output/server/_libs/h3+rou3+srvx.mjs                            14.21 kB │ gzip:   4.23 kB
  .output/server/index.mjs                                         15.32 kB │ gzip:   4.54 kB
  .output/server/_libs/cmdk.mjs                                    16.55 kB │ gzip:   5.49 kB
  .output/server/_libs/radix-ui__react-tooltip.mjs                 18.19 kB │ gzip:   4.15 kB
  .output/server/_ssr/classificados.meus-q3PjAUwf.mjs              22.10 kB │ gzip:   5.03 kB
  .output/server/_libs/@radix-ui/react-popover+[...].mjs           22.99 kB │ gzip:   5.63 kB
  .output/server/_ssr/classificados-data--4W8BZT7.mjs              25.40 kB │ gzip:   5.72 kB
  .output/server/_libs/@floating-ui/dom+[...].mjs                  25.85 kB │ gzip:   6.56 kB
  .output/server/_libs/@floating-ui/core+[...].mjs                 25.89 kB │ gzip:   6.36 kB
  .output/server/_libs/@floating-ui/react-dom+[...].mjs            31.20 kB │ gzip:   7.97 kB
  .output/server/_libs/supabase__supabase-js.mjs                   34.01 kB │ gzip:   9.91 kB
  .output/server/_libs/lucide-react.mjs                            34.67 kB │ gzip:   7.16 kB
  .output/server/_libs/phosphor-icons__react.mjs                   41.87 kB │ gzip:  10.47 kB
  .output/server/_libs/@radix-ui/react-select+[...].mjs            46.67 kB │ gzip:  10.12 kB
  .output/server/_libs/tanstack__query-core.mjs                    47.92 kB │ gzip:  10.65 kB
  .output/server/_libs/supabase__phoenix.mjs                       49.12 kB │ gzip:  12.36 kB
  .output/server/_libs/sonner.mjs                                  51.91 kB │ gzip:  11.77 kB
  .output/server/_ssr/server-B50EZsH3.mjs                          56.93 kB │ gzip:  14.96 kB
  .output/server/_libs/supabase__realtime-js+unenv.mjs             77.91 kB │ gzip:  19.87 kB
  .output/server/_libs/@tanstack/router-core+[...].mjs             79.32 kB │ gzip:  19.96 kB
  .output/server/_libs/tailwind-merge.mjs                          85.65 kB │ gzip:  15.21 kB
  .output/server/_libs/@radix-ui/react-alert-dialog+[...].mjs      86.45 kB │ gzip:  20.28 kB
  .output/server/_libs/supabase__postgrest-js.mjs                 105.41 kB │ gzip:  21.66 kB
  .output/server/_libs/@supabase/storage-js+[...].mjs             118.93 kB │ gzip:  22.09 kB
  .output/server/_libs/supabase__auth-js.mjs                      300.79 kB │ gzip:  59.88 kB
  .output/server/_ssr/routes-BpOFjnel.mjs                         342.24 kB │ gzip:  54.82 kB
  .output/server/_libs/@tanstack/react-router+[...].mjs           654.32 kB │ gzip: 137.52 kB

  ✓ built in 1.23s
  [nitro] ℹ Using auto generated worker name: joaofernaine-condominio-residencial-miguel-arcanjo
  ℹ Generated .output/server/wrangler.json
  ℹ Generated .wrangler/deploy/config.json
  ℹ Generated .output/public/_headers
  ℹ Generated .output/nitro.json

  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```
  Build concluído sem erros (exit 0), único WARN é sobre
  `inlineDynamicImports` (config do Nitro, não relacionado ao componente).
