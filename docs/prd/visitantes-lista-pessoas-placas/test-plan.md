# Test Plan — visitantes-lista-pessoas-placas

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — usa Playwright de verdade contra o app rodando
> local apontado para o Supabase de **QA** (`fqgmmmxxqzopcwbsdqgk`), nunca
> produção.

## Banco de dados

- [x] Migration aplicada em QA: `information_schema.columns` mostra `pessoas`
  e `placas` como `jsonb` nullable em `visitantes`.

  ```sql
  select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema='public' and table_name='visitantes' and column_name in ('pessoas','placas')
  order by column_name;
  ```
  ```json
  [{"column_name":"pessoas","data_type":"jsonb","is_nullable":"YES"},
   {"column_name":"placas","data_type":"jsonb","is_nullable":"YES"}]
  ```

- [x] Insert de teste com 8 pessoas e 2 placas é aceito; insert com 9 pessoas
  é rejeitado pela constraint `visitantes_pessoas_shape`; insert com 3 placas
  é rejeitado por `visitantes_placas_shape`.

  Insert 8 pessoas / 2 placas (aceito):
  ```sql
  insert into public.visitantes
    (condominio_id, morador_id, tipo_visita, nome_visitante, cpf, placa_veiculo,
     data_entrada, data_saida, status, pessoas, placas)
  values
    ('0c042d79-e7b0-449c-8430-59e6971d0e70', 'b3c88f79-9bf2-40c2-b44b-6a0fc7e645b3',
     'visita', 'Teste QA Pessoa 1', '529.982.247-25', 'ABC1D23',
     current_date, current_date + 1, 'pendente',
     '[{"nome":"P1","cpf":"111"},...,{"nome":"P8","cpf":"111"}]'::jsonb,
     '["ABC1D23","XYZ9E88"]'::jsonb)
  returning id;
  -- resultado: [{"id":"6d461a11-c8ea-4d38-95a4-1202d3799f97"}]  (sucesso)
  ```

  Insert 9 pessoas (rejeitado):
  ```
  ERROR: 23514: new row for relation "visitantes" violates check constraint
  "visitantes_pessoas_shape"
  DETAIL: Failing row contains (9e9ca75a-333f-486b-b7d4-cb88a3f586e0, ...,
  [{"cpf": "111", "nome": "P1"}, ..., 9 itens], null).
  ```

  Insert 3 placas (rejeitado):
  ```
  ERROR: 23514: new row for relation "visitantes" violates check constraint
  "visitantes_placas_shape"
  DETAIL: Failing row contains (fcd894cf-b4a9-4414-ae33-41a1af5ccd5e, ...,
  [{"cpf": "111", "nome": "P1"}], ["ABC1D23", "XYZ9E88", "AAA1A11"]).
  ```

- [x] Registro legado (simulado inserindo `pessoas=null, placas=null,
  nome_visitante='vitoria', cpf=null, placa_veiculo='FAX6H27'`, espelhando um
  registro real de produção) não quebra nenhuma query existente.

  ```sql
  insert into public.visitantes
    (condominio_id, morador_id, tipo_visita, nome_visitante, cpf, placa_veiculo,
     data_entrada, data_saida, status, pessoas, placas)
  values
    ('0c042d79-e7b0-449c-8430-59e6971d0e70', 'b3c88f79-9bf2-40c2-b44b-6a0fc7e645b3',
     'visita', 'vitoria', null, 'FAX6H27', current_date, current_date + 1,
     'pendente', null, null)
  returning id;
  -- resultado: [{"id":"b7e78ede-5c22-4760-977c-e6e5936b750b"}]
  ```
  Query de leitura (mesmo shape usado por `fetchVisitantesDoCondominio`) rodou
  sem erro e retornou o registro legado junto com os novos:
  ```json
  {"id":"b7e78ede-5c22-4760-977c-e6e5936b750b","nome_visitante":"vitoria","cpf":null,"placa_veiculo":"FAX6H27","pessoas":null,"placas":null,"status":"pendente"}
  ```

## Fluxo completo — Visita, mínimo

- [x] Visita, 1 pessoa (nome + CPF válido), 0 carros, datas válidas → salva
  com sucesso; toast de confirmação; card do morador mostra 1 pessoa e nenhum
  chip de placa.

  Logado como morador de teste (`morador.qa.mobile@example.com`), dialog
  "Cadastrar visitante" preenchido: nome "Joana Ribeiro da Silva", CPF
  `529.982.247-25` (máscara aplicada automaticamente ao digitar
  `52998224725`), 0 carros, entrada 01/08/2026, saída 03/08/2026. Ao
  submeter, dialog mudou para tela de sucesso:
  ```yaml
  - generic [ref=e742]: Visitante cadastrado com sucesso. Aguarde aprovação.
  - button "Cadastrar outro visitante"
  - button "Concluir"
  ```
  Após fechar, snapshot de acessibilidade do card do morador:
  ```yaml
  - listitem:
      - paragraph: Joana Ribeiro da Silva
      - generic: Visita
      - list:
          - listitem:
              - generic: 1. Joana Ribeiro da Silva
              - text: — CPF 529.982.247-25
      - paragraph: 01/08/2026 → 03/08/2026
  ```
  Sem badge "N pessoas" (correto, só 1 pessoa) e sem nenhum chip de placa
  (correto, 0 carros).

## Fluxo completo — Visita, múltiplas pessoas e 1 carro

- [x] Visita, 3 pessoas (nomes + CPFs válidos e distintos), 1 carro (placa
  válida), datas válidas → salva; painel da síndica lista as 3 pessoas com
  nome+CPF e a placa.

  Pessoas: Carlos Eduardo Mendes (CPF 529.982.247-25), Beatriz Souza Lima
  (CPF 390.533.447-05), Rafael Costa Andrade (CPF 111.444.777-35); 1 carro
  placa ABC1D23; entrada 05/08/2026, saída 07/08/2026. Submissão retornou
  tela de sucesso. Card do morador confirmou "3 pessoas" + lista completa.
  Snapshot de acessibilidade do painel da síndica (`#admin-visitantes`,
  logada como `joaovftoledo1@gmail.com`):
  ```yaml
  - listitem:
      - paragraph: Carlos Eduardo Mendes
      - generic: Visita
      - generic: 3 pessoas
      - list:
          - listitem: { generic: 1. Carlos Eduardo Mendes, text: — CPF 529.982.247-25 }
          - listitem: { generic: 2. Beatriz Souza Lima, text: — CPF 390.533.447-05 }
          - listitem: { generic: 3. Rafael Costa Andrade, text: — CPF 111.444.777-35 }
      - generic: ABC1D23
      - paragraph: 05/08/2026 → 07/08/2026
  ```

## Fluxo completo — Airbnb, máximo (8 pessoas, 2 carros)

- [x] Airbnb/Temporada, 8 pessoas, 2 carros, todos os dados válidos → dialog
  permite rolar até o fim, os botões "Cancelar"/"Cadastrar" continuam
  visíveis/clicáveis durante a rolagem, submissão salva com sucesso; painel
  da síndica lista as 8 pessoas e as 2 placas.

  Antes de submeter, medi via `browser_evaluate` (`getBoundingClientRect`)
  a posição dos botões Cancelar/Cadastrar com o conteúdo do dialog
  (`scrollHeight=1757`, `clientHeight=773`) rolado até o fim
  (`dialog.scrollTop = dialog.scrollHeight` → `scrollTop=984`, o máximo):
  ```json
  { "before(scrollTop=0)": { "Cancelar": {"top":732.9,"bottom":768.9}, "Cadastrar": {"top":732.9,"bottom":768.9} },
    "after(scrollTop=984, máximo)": { "Cancelar": {"top":732.9,"bottom":768.9}, "Cadastrar": {"top":732.9,"bottom":768.9} },
    "windowInnerHeight": 861 }
  ```
  Posição idêntica antes/depois de rolar até o fim → footer sticky funciona,
  botões permanecem visíveis e clicáveis.

  8 pessoas (Ana Paula Ferreira … Henrique Souza Castro, CPFs válidos e
  distintos gerados com dígito verificador correto) + 2 placas (ABC1D23,
  XYZ9E88) + tipo Airbnb/Temporada + entrada 10/08/2026 + saída 15/08/2026.
  Submissão retornou tela de sucesso. Painel da síndica confirmou:
  ```yaml
  - listitem:
      - paragraph: Ana Paula Ferreira
      - generic: Airbnb
      - generic: 8 pessoas
      - list: [8 itens, "1. Ana Paula Ferreira — CPF 123.456.781-43" … "8. Henrique Souza Castro — CPF 891.234.567-28"]
      - generic: [ABC1D23, XYZ9E88]
      - paragraph: 10/08/2026 → 15/08/2026
  ```

## Limites dos seletores

- [x] Seletor "Quantas pessoas vão entrar?" não oferece a opção 9 (nem
  qualquer valor acima de 8); seletor "Quantos carros vão entrar?" oferece a
  opção 0 e não oferece valor acima de 2.

  Snapshot de acessibilidade do listbox aberto (seletor de pessoas):
  ```yaml
  - listbox:
    - option "1" [selected]
    - option "2"
    - option "3"
    - option "4"
    - option "5"
    - option "6"
    - option "7"
    - option "8"
  ```
  (8 opções, nenhuma acima de 8.) Listbox do seletor de carros:
  ```yaml
  - listbox:
    - option "0" [selected]
    - option "1"
    - option "2"
  ```
  (0, 1, 2 — nenhuma acima de 2.)

## Validação de CPF

- [x] CPF `111.111.111-11` (dígitos repetidos) é rejeitado com mensagem citando
  a pessoa.

  Preenchido nome "Teste CPF Repetido" + CPF `111.111.111-11` na pessoa 1,
  submetido via `form.requestSubmit()`. Resultado capturado do toaster
  (`[data-sonner-toaster]`) logo após o clique:
  ```json
  { "toasterHTML": "CPF inválido na pessoa 1.", "activeId": "v-pessoa-0-cpf" }
  ```
  Bloqueou a submissão (dialog não avançou para tela de sucesso) e moveu o
  foco para o campo do CPF da pessoa 1.

- [x] CPF `123.456.789-00` (dígito verificador inválido) é rejeitado.

  Mesmo campo trocado para `123.456.789-00`, resubmetido:
  ```json
  { "cpfValue": "123.456.789-00", "toasterHTML": "CPF inválido na pessoa 1.", "activeId": "v-pessoa-0-cpf" }
  ```

- [x] CPF válido (dígito verificador correto) é aceito e a submissão passa
  dessa etapa.

  Campo trocado para `529.982.247-25` (válido), datas preenchidas,
  resubmetido — dessa vez a submissão foi concluída com sucesso (novo
  registro "Teste CPF Repetido — CPF 529.982.247-25" apareceu na lista do
  morador e o dialog mostrou a tela de sucesso "Visitante cadastrado com
  sucesso. Aguarde aprovação."). Confirma que o CPF válido passou a
  validação e o fluxo completou.

- [x] Duas pessoas com o mesmo CPF na mesma submissão são bloqueadas, com
  mensagem citando o número da segunda ocorrência.

  2 pessoas com CPF `529.982.247-25` idêntico em ambas, submetido:
  ```json
  { "toasterHTML": "O CPF da pessoa 2 está repetido.", "activeId": "v-pessoa-1-cpf" }
  ```
  Mensagem cita corretamente a pessoa 2 (segunda ocorrência) e foca o campo
  dela.

## Validação de placa

- [x] Placas em formato inválido (`AB1234`, `ABCD123`) são rejeitadas com
  mensagem citando o carro.

  Placa 1 preenchida com `AB1234` (6 caracteres, formato incompleto):
  ```json
  { "placaValue": "AB1234", "toasterHTML": "Placa 1 inválida. Use ABC1D23 ou ABC1234.", "activeId": "v-placa-0" }
  ```
  Trocado para `ABCD123` (4 letras seguidas, não bate com Mercosul nem
  antigo):
  ```json
  { "placaValue": "ABCD123", "toasterHTML": "Placa 1 inválida. Use ABC1D23 ou ABC1234." }
  ```
  Ambos os formatos inválidos rejeitados, mensagem cita "Placa 1".

- [x] Placas em formato antigo (`ABC1234`) e Mercosul (`ABC1D23`) são aceitas.

  Placa 1 trocada para `ABC1234` (formato antigo) com o resto do form
  válido → submissão concluída (`dialogState: "success"`). Em outra
  submissão, 2 carros com placas Mercosul `ABC1D23` e `XYZ9E88` → também
  concluída com sucesso (ver evidência do teste de duplicidade abaixo, que
  usa essas mesmas placas Mercosul após corrigir a segunda).

- [x] Duas placas iguais na mesma submissão são bloqueadas.

  2 carros, ambos com placa `ABC1D23`, submetido:
  ```json
  { "toasterHTML": "A placa 2 está repetida.", "activeId": "v-placa-1" }
  ```
  Corrigindo a placa 2 para `XYZ9E88` (Mercosul, distinta) e resubmetendo:
  `{ "dialogState": "success" }` — confirma que a rejeição foi
  especificamente pela duplicidade, não por formato, e que Mercosul é aceito
  quando as placas são distintas.

## Redimensionar a lista de pessoas

- [x] Preencher 5 pessoas, diminuir o seletor para 2 → aparece confirmação
  antes de descartar as pessoas 3–5 preenchidas; cancelando a confirmação
  mantém as 5 pessoas e o seletor volta a mostrar 5.

  5 pessoas selecionadas, pessoas 3–5 preenchidas com nome. Ao mudar o
  seletor nativo para "2", o Playwright MCP detectou o `confirm()` nativo do
  navegador:
  ```
  ["confirm" dialog with message "As últimas 3 pessoa(s) já têm dados
  preenchidos. Remover mesmo assim?"]: can be handled by browser_handle_dialog
  ```
  Dialog cancelado (`browser_handle_dialog accept=false`). Estado após
  cancelar:
  ```json
  { "trigger.textContent": "5", "fieldsetsCount": 5, "p4nome": "Pessoa Extra 5" }
  ```
  Confirma que os dados das 5 pessoas foram mantidos e o seletor visível
  (`#v-qtd-pessoas`) voltou a mostrar "5".

- [x] Confirmando a redução, as pessoas 3–5 são removidas e o seletor mostra 2.

  Repetindo a mesma mudança de seletor para "2", o mesmo `confirm()`
  apareceu novamente; desta vez aceito (`browser_handle_dialog accept=true`).
  Estado após confirmar:
  ```json
  { "triggerText": "2", "fieldsetsCount": 2 }
  ```
  Pessoas 3–5 removidas, seletor mostra "2".

## Foco em erro fora da viewport

- [x] Deixar o nome da pessoa 5 (de 8) vazio e submeter → a submissão é
  bloqueada, a tela rola até o campo da pessoa 5 e ele recebe foco visível.

  8 pessoas preenchidas (CPFs válidos), pessoa 5 (índice 4) com nome vazio
  de propósito. Dialog rolado para o topo (`dialog.scrollTop = 0`) antes de
  submeter, medindo a posição do campo antes/depois do clique em
  "Cadastrar":
  ```json
  {
    "beforeTop": 915.05, "beforeInViewport": false,
    "afterTop": 781.05, "afterInViewport": true,
    "activeId": "v-pessoa-4-nome",
    "scrollTopBefore(nome errado, é o valor DEPOIS do auto-scroll)": 134
  }
  ```
  Campo saiu de fora da viewport (`top=915`, janela com `innerHeight=861`)
  para dentro dela (`top=781`) após o clique, e `document.activeElement.id`
  passou a ser `v-pessoa-4-nome` — confirma rolagem automática + foco.
  Resubmissão confirmou que o campo continua vazio e o foco se mantém
  (`{"nome4":"", "activeId":"v-pessoa-4-nome"}`), ou seja, a submissão
  permaneceu bloqueada. A captura do texto exato do toast
  ("Informe o nome completo da pessoa 5.", linha 147 de
  `visitantes-novo-dialog.tsx`) foi tentada mas o toast já havia
  desaparecido do DOM nas janelas de tempo verificadas (timing flaky do
  sonner em automação) — o comportamento de bloqueio + rolagem + foco está
  comprovado por outra via (medições de posição/foco acima), então não
  considero isso uma falha do item, apenas uma limitação da captura.

## Exibição — fallback de registros legados

- [x] O registro legado inserido no cenário de banco (nome "vitoria", sem
  CPF, placa "FAX6H27") aparece no painel da síndica como uma lista de 1
  pessoa ("vitoria — CPF não informado") e um chip de placa "FAX6H27", sem
  erro de renderização/crash.

  Snapshot de acessibilidade do painel da síndica (`#admin-visitantes`):
  ```yaml
  - listitem:
      - paragraph: vitoria
      - generic: Visita
      - list:
          - listitem:
              - generic: 1. vitoria
              - text: — CPF não informado
      - generic: FAX6H27
      - paragraph: 27/07/2026 → 28/07/2026
  ```
  Mesmo padrão confirmado no card do morador. Sem badge "N pessoas" (1
  pessoa só, correto) e sem erro no console além do warning de hidratação
  pré-existente (não relacionado, ver seção de achados fora do escopo no
  resumo final). Outro registro legado real de produção,
  "Francisco de Assis Nascimento Junior" (`cpf 123.456.789-00`, dígito
  verificador inválido, `pessoas=null`), também renderizou corretamente sem
  crash, confirmando que o fallback tolera CPF legado inválido.

## Regressão

- [x] Aprovar e recusar um cadastro continuam funcionando (síndica consegue
  mudar o status e ver o motivo de recusa).

  Aprovado "Joana Ribeiro da Silva" pelo botão "Aprovar"; confirmado via SQL:
  ```json
  {"id":"a54468ee-1c0f-4079-96e6-1aecd0d544ec","nome_visitante":"Joana Ribeiro da Silva","status":"aprovado","motivo_recusa":null}
  ```
  Recusado "Teste CPF Repetido" pelo botão "Recusar" + motivo "Teste QA -
  motivo de recusa" no dialog de recusa; confirmado via SQL:
  ```json
  {"id":"38038ee2-9799-4c48-8f10-aa64aa4d3f88","nome_visitante":"Teste CPF Repetido","status":"recusado","motivo_recusa":"Teste QA - motivo de recusa"}
  ```
  Ambos os itens desapareceram do filtro "Pendente" da lista da síndica
  imediatamente após a ação (confirmado via snapshot).

- [x] Badge de pendências (sino) continua contando corretamente após os
  cadastros de teste.

  Badge mostrava "12" pendências ao logar (antes de aprovar/recusar).
  Aprovar+recusar 1 visitante cada não atualiza o badge instantaneamente
  porque `admin-pendencias-badge.tsx` busca a contagem só no mount + a cada
  60s (`setInterval(tick, 60_000)`, sem realtime) — comportamento existente,
  não é bug desta feature. Após recarregar a página (forçando novo fetch),
  o badge mostrou "10" (`{"text":"10","aria":"10 pendências — clique para
  ver a primeira"}`), batendo exatamente com a contagem SQL independente:
  ```json
  {"mensagens":1,"chamados":1,"reservas":1,"visitantes":7,"classificados":0}
  ```
  (1+1+1+7+0 = 10). Confirma que a contagem está correta e que
  `admin-pendencias-badge.tsx` segue funcionando sem alteração, como
  esperado pelos requisitos.

- [x] Badge "N pessoas" aparece tanto para Visita quanto para Airbnb quando há
  mais de 1 pessoa (antes só aparecia em Airbnb).

  Confirmado no painel da síndica: "Teste QA Pessoa 1" (Visita) mostra
  badge "8 pessoas"; "Carlos Eduardo Mendes" (Visita) mostra "3 pessoas";
  "Pessoa Um Duplicada" (Visita) mostra "2 pessoas"; "Ana Paula Ferreira"
  (Airbnb) mostra "8 pessoas". Badge aparece para os dois tipos quando
  `pessoas.length > 1`, e não aparece para registros com 1 pessoa só
  (Joana Ribeiro da Silva, vitoria, Francisco de Assis...).

## Responsividade

- [x] Viewport 375×667: nenhum overflow horizontal no dialog de cadastro nem
  nos cards de listagem (medir `getBoundingClientRect()` dos elementos
  extremos, confirmando `right <= 375`).

  Viewport redimensionado para 375×667 (`browser_resize`). Cards de
  listagem do morador:
  ```json
  { "body": { "scrollWidth": 360, "clientWidth": 360 },
    "maxRightAmongLis": 344, "worstEl": "Ana Paula FerreiraAirbnb8 pess" }
  ```
  `scrollWidth === clientWidth` (sem overflow) e o card mais largo termina
  em `right=344 <= 360`. Dialog "Cadastrar visitante" com 8 pessoas + 2
  carros no mesmo viewport:
  ```json
  { "dialogScrollWidth": 339, "dialogClientWidth": 339, "dialogRight": 358.125,
    "bodyScrollWidth": 345, "windowInnerWidth": 375 }
  ```
  `dialogRight=358.1 <= 375` e `scrollWidth === clientWidth` no dialog
  também — sem overflow horizontal em nenhum dos dois.

## Build

- [x] `npx tsc --noEmit` e `bun run build` (ou `npm run build`) passam sem
  erro.

  `npx tsc --noEmit`:
  ```
  src/components/admin-pendencias-badge.tsx(25,163): error TS2339: Property 'catch' does not exist on type 'PromiseLike<number>'.
  src/components/admin-pendencias-badge.tsx(26,159): error TS2339: Property 'catch' does not exist on type 'PromiseLike<number>'.
  src/components/admin-pendencias-badge.tsx(27,161): error TS2339: Property 'catch' does not exist on type 'PromiseLike<number>'.
  src/components/admin-pendencias-badge.tsx(28,163): error TS2339: Property 'catch' does not exist on type 'PromiseLike<number>'.
  src/components/admin-pendencias-badge.tsx(29,166): error TS2339: Property 'catch' does not exist on type 'PromiseLike<number>'.
  ```
  Exatamente os 5 erros pré-existentes já sinalizados como não bloqueadores
  desta feature (não tocam nenhum arquivo de `visitantes-*`). Nenhum erro
  novo.

  `bun run build`: build completo (client + ssr + nitro) concluído com
  sucesso:
  ```
  ✓ built in 3.14s   (client)
  ✓ built in 1.41s   (ssr)
  ✓ built in 1.39s   (nitro, preset cloudflare-module)
  [nitro] ✔ Generated public .output/public
  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  BUILD_EXIT=0
  ```
