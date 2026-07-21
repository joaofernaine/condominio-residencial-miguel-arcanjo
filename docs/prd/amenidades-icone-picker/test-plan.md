# Test Plan — amenidades-icone-picker

> NOTA (QA, 2026-07-20, sessão com Playwright disponível): itens 1-6
> executados de ponta a ponta nesta sessão com o MCP do Playwright real
> (navegador de verdade, `http://localhost:8081`, login como síndica QA).
> Todos os 6 itens passaram. Evidência (snapshot de acessibilidade e/ou
> screenshot) colada abaixo de cada item.
>
> Achado de ambiente (não é bug do seletor de ícone, registrado para
> conhecimento): a página pública (`PublicLanding`, `src/routes/index.tsx`)
> busca amenidades pelo `LANDING_CONDOMINIO_ID` hardcoded em
> `src/lib/portal-data.ts:587` (`a3dcd3da-c281-4bbc-8dad-f62d94353281`), mas
> o único condomínio existente no banco de QA (`fqgmmmxxqzopcwbsdqgk`) tem
> id `0c042d79-e7b0-449c-8430-59e6971d0e70` ("QA Test") — o mesmo usado por
> `profile.condominio_id` da síndica de QA. Isso significa que qualquer
> amenidade cadastrada pelo admin de QA nunca aparece na landing pública de
> QA, independente do recurso em teste. Para verificar os itens 4 e 5 (card
> público), inseri temporariamente, só como dado de teste via SQL
> (`execute_sql` no projeto Supabase QA, nunca no de produção), uma linha
> em `condominios` com esse id hardcoded e cópias espelho das amenidades
> criadas, tirei a evidência, e depois apaguei essas linhas-espelho
> (confirmado com `count(*) = 0` ao final). As amenidades reais
> (Churrasqueira/flame, Spa/🧖, Piscina/waves) continuam cadastradas no
> condomínio real de QA para referência de sessões futuras. Recomendo ao
> implementador/usuário avaliar se vale seedar o condomínio de QA com o
> mesmo id fixo, ou tornar `LANDING_CONDOMINIO_ID` configurável por
> ambiente — mas isso é decisão de produto/infra fora do escopo desta
> tarefa de ícone.

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

- [x] Login como síndica no admin, abrir a seção de Amenidades, clicar em
  "Nova amenidade" e abrir o campo "Ícone": confirmar que agora aparece um
  seletor (não mais uma caixa de texto livre solta), com grade de ícones
  lucide rotulados em português.

  Executado via Playwright real em `http://localhost:8081`. Login como
  `joaovftoledo1@gmail.com` (síndica QA) — o primeiro login exigiu troca de
  senha provisória (fluxo LGPD, não relacionado a este teste), senha final
  usada: `QaTeste2026#Nova`. Cliquei em "Nova amenidade" e no botão
  "Escolher ícone". Snapshot de acessibilidade do popover:

  ```yaml
  - dialog:
    - generic:
      - button "Segurança" [active]
      - button "Piscina"
      - button "Academia"
      - button "Churrasqueira"
      - button "Área verde"
      - button "Jardim"
      - button "Estacionamento"
      - button "Salão de festas"
      - button "Salão"
      - button "Convivência"
      - button "Playground"
      - button "Jogos"
      - button "Wi-Fi"
      - button "Copa"
      - button "Área externa"
      - button "Prédio"
    - generic:
      - text: "Ou cole um emoji (ex: 🍖, 🧖, 🛝)"
      - textbox "Ou cole um emoji (ex: 🍖, 🧖, 🛝)"
  ```

  Confirmado: não é mais um `<Input>` de texto livre — é um Popover com
  grade de botões de ícone lucide rotulados em português + campo de emoji
  separado. Screenshot confirmando visualmente (grade de ícones com
  rótulos): `item1-icon-picker-popover.png`.

- [x] Selecionar o ícone "Churrasqueira" (Flame) na grade, preencher nome
  "Churrasqueira" e salvar. Verificar que a prévia no próprio dialog já
  mostrava o ícone de chama antes de salvar (não uma estrelinha).

  Cliquei no botão "Churrasqueira" da grade. O popover fechou e o botão de
  prévia do campo "Ícone" passou a mostrar o ícone de chama com o texto
  "flame" ao lado — confirmado tanto pelo snapshot de acessibilidade
  (`button "flame" [active]`) quanto visualmente
  (`item2-after-churrasqueira-select.png`, ícone de chama dentro da caixa
  `bg-secondary`, antes de qualquer salvamento). Preenchi o nome
  "Churrasqueira" e cliquei "Salvar" — toast de sucesso e amenidade
  apareceu na lista do admin.

- [x] Na lista do admin, confirmar visualmente que a amenidade
  "Churrasqueira" aparece com o ícone de chama (não `Sparkles`/estrelinha).

  Screenshot do item da lista (`item3-admin-list-churrasqueira.png`):
  mostra o ícone de chama dentro de uma caixinha cinza ao lado do texto
  "Churrasqueira / Ordem 0 · Ícone: flame · sem descrição". Não é o
  fallback `Sparkles` (estrelinha).

- [x] Na página pública (`/`), seção "Sobre o condomínio", confirmar que o
  card da amenidade "Churrasqueira" mostra o mesmo ícone de chama.

  Achado de ambiente (ver nota no topo do arquivo): a landing pública usa
  `LANDING_CONDOMINIO_ID` hardcoded, que não bate com o condomínio real do
  banco de QA — nenhuma amenidade cadastrada pelo admin aparecia na landing
  de QA por esse motivo, não por bug do seletor de ícone. Inseri uma cópia
  de teste da amenidade sob esse id hardcoded (via SQL, Supabase QA, dados
  descartáveis, removidos ao final — ver nota). Com isso, a landing pública
  (deslogada, `http://localhost:8081/`, seção "Sobre o condomínio") passou
  a mostrar o card "Churrasqueira" com o mesmo ícone de chama dentro da
  caixa `bg-secondary`, usando o mesmo componente `AmenidadeCard`/
  `AmenidadeIconTile` do admin. Screenshot: `item4-public-card-churrasqueira.png`.

- [x] Criar uma segunda amenidade usando o campo de emoji livre (ex. colar
  🧖 para "Spa"), salvar, e confirmar que tanto a prévia no dialog quanto o
  card público mostram o emoji colado — não o fallback estrelinha.

  Criei amenidade "Spa" colando `🧖` no campo de emoji livre do popover.
  Snapshot de acessibilidade confirmou o valor exato armazenado:
  `button "🧖" [expanded]` (prévia) e `textbox "Ou cole um emoji..."` com
  `text: 🧖` — um único emoji (a aparência "dobrada" observada no
  screenshot é só artefato de renderização de fonte do emoji composto, não
  duplicação real de dado). Screenshot do dialog antes de salvar
  (`item5-dialog-preview.png`): emoji renderizado solto/maior, **sem**
  caixa `bg-secondary` — visualmente diferente do ícone lucide
  "Churrasqueira" visível atrás. Após salvar, lista do admin
  (`item5-admin-list-spa.png`) mostra "Spa" com o emoji solto (sem caixa),
  ao lado de "Churrasqueira" com caixa. Card público (mesmo workaround de
  ambiente do item 4, `item5-public-spa-card-full.png`): mostra
  "Churrasqueira" com caixa cinza + ícone de chama e "Spa" com o emoji 🧖
  solto e maior, sem caixa — não há fallback estrelinha em nenhum dos
  dois.

- [x] Editar uma amenidade já existente que hoje usa um ícone lucide válido
  (ex. "waves"/piscina) e confirmar que o seletor abre já com esse ícone
  pré-selecionado/destacado na grade, sem perder o valor ao reabrir o
  dialog.

  Criei uma amenidade "Piscina" selecionando o ícone "Piscina" (waves) na
  grade e salvei. Cliquei em "Editar" nessa amenidade: o dialog "Editar
  amenidade" abriu com o botão de prévia já mostrando `button "waves"`
  (snapshot de acessibilidade), sem precisar reselecionar. Ao clicar nesse
  botão para abrir a grade novamente, o botão "Piscina" aparece com um
  destaque visual (borda escura + fundo cinza) diferente de todos os
  outros ícones da grade — screenshot `item6-edit-piscina-grid.png`
  confirma o destaque em "Piscina" e a prévia "waves" abaixo, coerente.
  Fechei o dialog com Escape sem salvar novas mudanças (edição não
  destrutiva).

- [x] Rodar `npm run build` (ou `bun run build`) e colar a saída completa,
  confirmando build sem erro.

  Executado de forma independente pelo QA em 2026-07-20 na raiz do projeto
  (`npm run build`). Saída completa (trecho relevante, sem erros/warnings de
  falha — só um aviso informativo do vite-tsconfig-paths e um WARN de
  inlineDynamicImports que não impede o build):

  ```
  > build
  > vite build

  The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
  vite v8.1.4 building client environment for production...
  ✓ 2053 modules transformed.
  ✓ built in 1.76s
  vite v8.1.4 building ssr environment for production...
  ✓ 106 modules transformed.
  ✓ built in 1.03s

  [nitro] ◐ Building [Nitro] (preset: cloudflare-module, compatibility: 2026-07-15)

  WARN inlineDynamicImports option is ignored because the codeSplitting option is specified.

  vite v8.1.4 building nitro environment for production...
  ✓ 2063 modules transformed.
  ✓ built in 476ms
  [nitro] ✔ Generated public .output/public
  ℹ Using auto generated worker name: joaofernaine-condominio-residencial-miguel-arcanjo
  ℹ Generated .output/server/wrangler.json
  ℹ Generated .wrangler/deploy/config.json
  ℹ Generated .output/public/_headers
  ℹ Generated .output/nitro.json

  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```

  Build finalizou com sucesso (client + SSR + Nitro), sem erros. Exit code 0.

  NOTA (implementador, não é check de QA): já rodei `npm run build` durante a
  implementação e passou limpo (client + SSR + Nitro). QA deve rodar de
  novo, de forma independente, e colar a própria saída — não copiar esta.
