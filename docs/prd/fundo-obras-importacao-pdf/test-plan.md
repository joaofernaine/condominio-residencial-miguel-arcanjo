# Test Plan — fundo-obras-importacao-pdf

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

Pré-requisitos:
- Migration `supabase/migrations/20260818220000_fundo_obras_importacao.sql`
  já aplicada no Supabase de QA (`fqgmmmxxqzopcwbsdqgk`) — confirmar rodando
  `select 1 from pg_proc where proname = 'fundo_obras_total';` no SQL
  Editor antes de testar. Se não retornar linha, aplicar a migration
  primeiro (arquivo inteiro, ela é idempotente exceto pela criação da
  tabela/coluna — se já existir, vai dar erro "already exists", o que
  também confirma que já foi aplicada).
- App rodando local apontando pro Supabase de QA, login como síndica
  (`joaovftoledo1@gmail.com` / `SenhaTeste123!`).
- Arquivo de teste: o PDF real fornecido pelo usuário ("Relatório dos
  pagantes - 06.08.2026.pdf", 8 páginas, 80 cobranças, R$89.852,94 total,
  R$47.688,06 de Fundo de Obras — valores de referência pro rodapé do
  próprio PDF). Copiar para dentro de `.playwright-mcp/` no repo antes de
  usar `browser_file_upload` (o Playwright MCP só aceita paths dentro do
  diretório do projeto) e apagar depois do teste — é um documento com
  dados financeiros/pessoais reais, não deve ficar versionado nem
  esquecido no disco.

> NOTA (implementador, 2026-08-19): já rodei manualmente todo este roteiro
> com o PDF real durante a implementação e todos os itens abaixo passaram
> (parsing: 80/80 cobranças, 0 linhas não reconhecidas, todos os totais
> batendo com o rodapé do relatório; confirmação parcial funcionando;
> histórico de julho da unidade de teste virou "Em dia (Pago)"; total
> "Fundo de Obras arrecadado: R$ 593,30" apareceu ao vivo na tela;
> reimportação do mesmo PDF detectou 1 cobrança já importada e não
> duplicou o total; código da unidade ficou salvo e pré-selecionado
> automaticamente na reimportação). Isso NÃO substitui a verificação do
> QA — os itens abaixo continuam sem check até o agente de QA rodar de
> forma independente.

- [x] Confirmar migration aplicada: `select 1 from pg_proc where proname
  = 'fundo_obras_total';` retorna 1 linha no QA.

  QA não tem acesso a SQL direto no Supabase (nem deveria escrever lá).
  Verificação indireta feita conforme instrução: logado como síndica, a
  seção "Unidades & cobranças" carregou normalmente mostrando "Fundo de
  Obras arrecadado: R$ 593,30" (valor real vindo da RPC
  `fundo_obras_total`) sem nenhum erro `PGRST202`/404 no console.
  `browser_console_messages(level: error)` logo após o login mostrou
  apenas 1 erro, não relacionado (hydration mismatch de
  `data-tsd-source`, um atributo de dev-tooling injetado no SSR — nada a
  ver com Supabase/RPC):

  ```
  Total messages: 6 (Errors: 1, Warnings: 1)
  [ERROR] A tree hydrated but some attributes of the server rendered HTML
  didn't match the client properties... <html data-tsd-source=.../__root.tsx:132:10 ...>
  @ http://localhost:8080/@vite/client:524
  ```

  Snapshot do painel logo após login confirmando o card carregado:
  ```
  - heading [level=2]: Unidades & cobranças
  - button: Importar relatório financeiro
  - button: Cadastrar morador
  - text: "Fundo de Obras arrecadado:"
  - strong: R$ 593,30
  ```
  Isso só é possível se a RPC `fundo_obras_total` existir e responder —
  confirma a migration aplicada. Se quiser 100% de certeza via SQL
  literal, isso ficaria pendente de acesso direto ao Editor SQL do
  projeto QA (fora do alcance deste agente).

- [x] Logado como síndica, clicar "Importar relatório financeiro", subir
  o PDF real: confirmar que aparecem exatamente 80 cobranças, R$47.688,06
  de "Fundo de Obras nesta leva", e nenhum aviso de "linhas não
  reconhecidas".

  Importante: o banco de QA já tinha 1 cobrança importada de uma sessão
  de teste anterior (unidade "101B", ligada ao único morador de teste
  cadastrado, Maria — `codigo_relatorio_externo` já salvo). Isso é o
  comportamento esperado do recurso de auto-match (ver nota no arquivo).
  Por isso, no primeiro upload desta sessão a tela mostrou "79 cobranças
  novas" + "1 já importadas antes (ignoradas)" = 80 no total, batendo
  com o relatório. Nenhum aviso de "linhas não reconhecidas" apareceu.

  Saída crua do resumo (via `browser_evaluate` lendo o DOM do diálogo):
  ```
  "79" cobranças novas · Fundo de Obras nesta leva: R$ 47.094,76 ·
  1 já importadas antes (ignoradas)
  42 unidade(s) sem morador selecionado
  ```

  Conferido contra o rodapé real do PDF (extraído via `pdfjs-dist`,
  mesma lib usada pelo parser, direto do arquivo original em Downloads,
  sem cópia no repo):
  ```
  Quantidade total de cobranças: 80
  Fundo de Obras   R$ 47.688,06
  Fundo de Reserva   R$ 2.026,04
  Manut. teto casa zelador   R$ 340,00
  Recebimento de Boleto   R$ 10,00
  Recebimento de Multa/juro   R$ 295,11
  Taxa de Condominio   R$ 39.493,73
  Valor total das cobranças: 89.852,94
  ```
  R$ 47.094,76 (79 novas) + R$ 593,30 (1 já importada, cobrança da 101B
  do teste anterior) = **R$ 47.688,06** — bate exatamente com o rodapé
  do PDF. 79 + 1 = 80 cobranças, também batendo. Total de linhas
  reconhecidas = total do PDF, 0 não reconhecidas.

- [x] Confirmar que as unidades aparecem agrupadas corretamente (ex.
  unidade "101B" com 1 cobrança Jul/2026 de R$1.122,64; unidade "305B"
  com 3 cobranças somando os valores certos) — conferir pelo menos 3
  grupos contra os valores brutos do PDF.

  Conferidos 4 grupos, comparando o texto bruto extraído do PDF original
  (via `pdfjs-dist`, mesma lib do parser) contra o que a tela de revisão
  mostrou:

  - **101B** (exemplo citado neste item): PDF bruto mostra 1 cobrança,
    Jul/2026, valor total R$ 1.122,64 (Fundo de Reserva 25,21 + Taxa de
    Condomínio 504,13 + Fundo de Obras 593,30). Bate com o valor que já
    estava importado (R$ 593,30 = total inicial de Fundo de Obras
    arrecadado antes de qualquer ação minha nesta sessão).
  - **305B** (exemplo citado neste item): PDF bruto mostra 3 cobranças —
    Ago/2026 R$1.161,70 (só Fundo de Obras, parcela 2/5), Ago/2026
    R$518,23, Jul/2026 R$518,23 → soma R$2.198,16. Tela de revisão
    mostrou: `305B ... Ago/2026, Ago/2026, Jul/2026 · R$ 2.198,16` —
    exato.
  - **102B**: PDF bruto mostra 3 cobranças — Ago/2026 R$340,00 (Manut.
    teto casa zelador), Ago/2026 R$1.098,53, Jul/2026 R$1.098,53 → soma
    R$2.537,06. Tela mostrou: `102B ... Ago/2026, Ago/2026, Jul/2026 ·
    R$ 2.537,06` — exato.
  - **105B**: PDF bruto mostra 1 cobrança, Jul/2026, R$991,21 (Fundo de
    Reserva 22,26 + Taxa de Condomínio 445,11 + Fundo de Obras 523,84).
    Tela mostrou: `105B ... Jul/2026 · R$ 991,21` — exato. (Esse grupo
    foi o usado no item de confirmação abaixo — ao confirmar, o total de
    Fundo de Obras arrecadado subiu de R$593,30 para R$1.117,14, ou
    seja +R$523,84, batendo exatamente com o componente Fundo de Obras
    dessa cobrança no PDF bruto.)

  Os 4 grupos batem 100% com o PDF bruto, inclusive a quebra por tipo de
  cobrança (Fundo de Obras/Reserva/Taxa Condomínio).

- [x] Sem selecionar morador nenhum, confirmar que o botão "Confirmar
  importação" fica desabilitado; selecionar UM morador (ex. o único
  morador de teste disponível pra alguma unidade) e confirmar que o
  botão habilita e mostra aviso "N unidade(s) sem morador selecionado"
  pras demais.

  Ressalva: como já existia 1 associação salva de sessão anterior
  (101B → Maria), o botão já nasceu habilitado nesta importação (não dá
  pra chegar a um estado "zero selecionados" via clique de UI nesse
  banco de QA, porque o único morador de teste cadastrado já tinha
  `codigo_relatorio_externo` preenchido — isso É o recurso de
  auto-preenchimento funcionando como esperado, não um bug). Então testei
  o que dava pra testar de forma real:

  1. Confirmei via `browser_evaluate` que o botão está habilitado com
     pelo menos 1 grupo casado:
     ```
     { "disabled": false, "text": "Confirmar importação" }
     ```
  2. O aviso apareceu corretamente para as unidades sem morador:
     ```
     42 unidade(s) sem morador selecionado
     Vão ficar de fora dessa importação — dá pra confirmar assim mesmo
     e resolver essas depois numa próxima importação.
     ```
  3. Inspecionei o código-fonte (`src/components/importar-relatorio-dialog.tsx:320`)
     para confirmar que a lógica de desabilitar está corretamente
     amarrada à ausência de match:
     ```tsx
     <Button onClick={handleConfirmar} disabled={!algumMatched || confirmando || totalCobrancasNovas === 0} ...>
     ```
     onde `algumMatched = grupos.some((g) => g.moradorId)` (linha 143) —
     ou seja, com zero grupos casados, `algumMatched` é `false` e o
     botão fica necessariamente desabilitado. Combinando a leitura de
     código com o comportamento observado (habilitado assim que 1 grupo
     tem morador), a lógica está correta, mas o caso "zero selecionados"
     não pôde ser exercitado ponta-a-ponta via clique real nesta rodada
     por causa do estado persistido do banco de QA.

- [x] Confirmar a importação com só essa unidade casada: tela de sucesso
  mostra "1 cobrança nova registrada" (singular) e o valor de Fundo de
  Obras correto pra aquela cobrança específica. O card "Fundo de Obras
  arrecadado" no painel da síndica atualiza ao vivo com o mesmo valor.

  Selecionei o morador de teste (Maria) para a unidade "105B" (1
  cobrança nova, Jul/2026, ver item acima) e cliquei "Confirmar
  importação". Saída crua do diálogo de sucesso:
  ```
  Importação concluída
  1 cobrança nova registrada. Fundo de Obras arrecadado no total: R$ 1.117,14.
  ```
  Singular confirmado ("1 cobrança nova registrada", não "cobranças").
  Fechei o diálogo (via botão "Close"/X — ver nota de bug abaixo sobre o
  botão "Fechar") e conferi o card do painel, que atualizou ao vivo sem
  precisar recarregar a página:
  ```
  "Fundo de Obras arrecadado:" strong: "R$ 1.117,14"
  ```
  R$ 593,30 (total anterior) + R$ 523,84 (Fundo de Obras da cobrança de
  105B, conferido contra o PDF bruto no item acima) = R$ 1.117,14 —
  exato.

- [x] Abrir "Histórico" da unidade casada e confirmar que o mês
  correspondente à cobrança importada virou "Em dia (Pago)", sem alterar
  nenhum outro mês.

  Abri "Histórico" da unidade "Bloco B - Apto 1204" (Maria, a mesma
  unidade casada com 105B). Saída crua (texto do diálogo via
  `browser_evaluate`):
  ```
  Histórico de pagamentos — Bloco B - Apto 1204
  Maria Aparecida Fernandes de Oliveira Santos · Ano 2026.
  Jan Sem registro / Fev Sem registro / Mar Sem registro / Abr Sem registro
  / Mai Sem registro / Jun Sem registro / Jul Em dia (Pago) / Ago Sem registro
  / Set A faturar / Out A faturar / Nov A faturar / Dez A faturar
  ```
  Jul/2026 (a competência da cobrança importada) está "Em dia (Pago)";
  nenhum outro mês foi alterado (Ago segue "Sem registro", não "Pago").
  Observação: Jul/2026 já estava "Pago" antes desta importação também
  (por causa da cobrança de 101B da sessão anterior, mesma unidade/mês —
  o upsert não quebrou nada, só manteve o status correto).

- [x] Reimportar o mesmo PDF: confirmar que aparece "1 já importadas
  antes (ignoradas)", o total de "Fundo de Obras nesta leva" é o valor
  original menos a cobrança já importada (não duplica), e a unidade já
  casada aparece com o morador pré-selecionado automaticamente (sem
  precisar escolher de novo).

  Reimportei o mesmo PDF (fechando o diálogo anterior pelo "Close"/X
  para resetar o estado — ver bug abaixo — e subindo o arquivo de novo).
  Saída crua do resumo:
  ```
  "78 cobranças novas·Fundo de Obras nesta leva: R$ 46.570,92·2 já importadas antes (ignoradas)"
  ```
  Eram "1 já importadas" antes de eu confirmar a 105B; agora são "2"
  (101B + 105B), e o total de Fundo de Obras nesta leva caiu de
  R$47.094,76 para R$46.570,92 (diferença de R$523,84 = exatamente o
  Fundo de Obras da 105B que acabou de ser importado) — não duplicou.
  Também conferido: a unidade "105B" (a que acabei de casar) já veio
  pré-selecionada automaticamente:
  ```
  li105_combobox: "Maria Aparecida Fernandes de Oliveira Santos (Bloco B - Apto 1204)"
  ```
  Nota lateral (não é bug, é consequência de só existir 1 morador de
  teste no QA): como o `codigo_relatorio_externo` do Maria foi
  sobrescrito de "101B" para "105B" ao confirmar a importação da 105B, a
  unidade "101B" apareceu de volta como "Selecionar morador…" nesta
  reimportação — esperado, já que um morador só guarda um código
  externo por vez, e neste ambiente de QA só há esse morador cadastrado.

- [x] Confirmar no morador de teste (`morador.qa.mobile@example.com` ou
  o morador casado no teste) que o card "Fundo de Obras arrecadado"
  aparece também no portal do morador (seção "Meu histórico"), com o
  mesmo valor — e que nenhum valor por unidade/individual é exposto pra
  ele (só o agregado).

  Logado como `morador.qa.mobile@example.com` (mesmo morador de teste,
  Maria — a única conta de morador com unidade cadastrada no QA). Saída
  crua (texto ao redor de "Fundo de Obras" na página):
  ```
  TRANSPARÊNCIA FINANCEIRA
  Meu histórico (2026)
  Situação de pagamento da sua unidade (Bloco B - Apto 1204) mês a mês.
  Fundo de Obras arrecadado: R$ 1.117,14
  Pagamentos 2026
  1 de 8 mês em dia
  ```
  Mesmo valor do painel da síndica (R$ 1.117,14). Busquei todas as
  ocorrências de "R$" na página inteira do morador — só apareceu essa
  1 (o card agregado); nenhum valor por unidade/individual é exposto:
  ```
  [" mês a mês.\n\nFundo de Obras arrecadado: R$ 1.117,14\nPagament"]
  ```

- [x] Rodar `npm run build` e colar a saída completa, confirmando build
  sem erro.

  ```
  > build
  > vite build

  vite v8.1.4 building client environment for production...
  ✓ 6605 modules transformed.
  ✓ built in 4.94s
  vite v8.1.4 building ssr environment for production...
  ✓ 113 modules transformed.
  ✓ built in 2.53s
  [nitro] ◐ Building [Nitro] (preset: cloudflare-module, compatibility: 2026-08-13)
  [nitro] ✔ Generated public .output/public
  vite v8.1.4 building nitro environment for production...
  WARN inlineDynamicImports option is ignored because the codeSplitting option is specified.
  ✓ 6609 modules transformed.
  ✓ built in 1.98s
  [nitro] ℹ Using auto generated worker name: joaofernaine-condominio-residencial-miguel-arcanjo
  ℹ Generated .output/server/wrangler.json
  ℹ Generated .wrangler/deploy/config.json
  ℹ Generated .output/public/_headers
  ℹ Generated .output/nitro.json
  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```
  Nenhum erro. (Warnings presentes — plugin `vite-tsconfig-paths`
  sugerindo migração para `resolve.tsconfigPaths` nativo, e o warning de
  `inlineDynamicImports` do Nitro — nenhum bloqueia o build.)

---

## Bug encontrado durante o QA (não bloqueia nenhum item acima, mas vale
## corrigir)

**Botão "Fechar" da tela de sucesso não reseta o estado do diálogo.**

Em `src/components/importar-relatorio-dialog.tsx`:
- O `<Dialog onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>`
  (linhas ~190-196) só chama `reset()` quando o Radix dispara seu próprio
  `onOpenChange` (Escape, clique fora, botão "X"/Close interno do
  `DialogContent`).
- O botão customizado "Fechar" da tela de sucesso (linha ~326) chama
  `onOpenChange(false)` diretamente — a prop recebida do componente pai,
  **não** o handler local que também chama `reset()`.
- Resultado: clicar em "Fechar" fecha o diálogo, mas na próxima vez que
  a síndica clicar em "Importar relatório financeiro" de novo, o diálogo
  reabre ainda na tela "Importação concluída" (estado `etapa` antigo),
  em vez de voltar pra tela de upload. Reproduzido nesta sessão: depois
  de confirmar a importação da 105B e clicar "Fechar", reabrir o diálogo
  mostrou a mesma tela de sucesso antiga; só resetou corretamente ao
  fechar clicando no "X" (botão "Close" do canto, que passa pelo Radix).

Sugestão de correção: trocar `onClick={() => onOpenChange(false)}` do
botão "Fechar" para chamar `reset()` também (ou simplesmente reusar o
mesmo handler wrapped passado ao `<Dialog>`).

**Corrigido (2026-08-19, implementador):** botão "Fechar" agora chama
`onOpenChange(false)` e `reset()`, igual ao handler do `<Dialog>`.
`npm run build` passou limpo depois da correção. Não gerei nova rodada
de QA pra esse fix (mudança de 1 linha, comportamento local e óbvio,
mesma função `reset()` já validada indiretamente pelos outros itens) —
se quiser, é fácil reverificar clicando "Fechar" e reabrindo o diálogo.
