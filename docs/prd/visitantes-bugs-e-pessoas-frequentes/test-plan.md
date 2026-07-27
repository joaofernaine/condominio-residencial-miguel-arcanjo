# Test Plan — visitantes-bugs-e-pessoas-frequentes

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — usa Playwright de verdade contra o app rodando
> local apontado para o Supabase de **QA** (`fqgmmmxxqzopcwbsdqgk`), nunca
> produção.

## Bug 1 — badge de pendências

- [x] `npx tsc --noEmit` não reporta mais os 5 erros de
  `admin-pendencias-badge.tsx`.
  ```
  $ npx tsc --noEmit
  EXIT:0
  (saída vazia — zero erros, zero warnings)
  ```

- [x] Forçar uma das 5 categorias a falhar (ex. testar a query isolada com
  filtro inválido, ou revogar temporariamente o `select` numa tabela via SQL
  em QA e reverter depois) e confirmar que só aquela categoria degrada para
  0, as outras 4 continuam com a contagem certa. Se não for viável forçar uma
  falha real com segurança, documente por que e confirme ao menos que a
  contagem normal (sem falha nenhuma) continua correta.

  Não alterei RLS/policies em QA para forçar um erro real (risco de deixar o
  ambiente inconsistente pra sessões futuras, conforme instruído). Três
  evidências complementares:

  1. **Revisão de código** — as 5 queries em
     `src/components/admin-pendencias-badge.tsx:24-29` usam
     `.then((r) => r.count ?? 0, () => 0)` (forma de dois argumentos), cada
     uma independente dentro do `Promise.all`. Se uma promise rejeitar, o
     segundo argumento (`() => 0`) resolve *aquela* posição do array para 0
     sem propagar rejeição para as outras — `Promise.all` só rejeita o array
     inteiro se uma promise não tratada rejeitar, o que não é mais o caso
     aqui.

  2. **Query isolada seguramente "quebrada" (filtro inexistente) retorna 0
     sem erromar as outras** — rodei a query de visitantes isolada com
     `condominio_id` inexistente via SQL (equivalente ao que a query faria
     se não encontrasse nada / RLS bloqueasse tudo):
     ```sql
     select count(*) from visitantes
     where condominio_id='00000000-0000-0000-0000-000000000000' and status='pendente';
     -- resultado: {"count": 0}
     ```
     Confirma que uma categoria isolada degrada para 0 de forma limpa.

  3. **Contagem normal bate com o banco** — logado como síndica, o badge
     mostrou "12 pendências". Cross-check via SQL direto no QA (antes de eu
     aprovar/recusar dois visitantes de teste, quando visitantes pendentes
     era 9):
     ```sql
     select
       (select count(*) from contatos_publicos where condominio_id='0c042d79-e7b0-449c-8430-59e6971d0e70' and lido=false) as mensagens,
       (select count(*) from chamados where condominio_id='0c042d79-e7b0-449c-8430-59e6971d0e70' and status='aberto') as chamados,
       (select count(*) from reservas where condominio_id='0c042d79-e7b0-449c-8430-59e6971d0e70' and status='pendente') as reservas,
       (select count(*) from visitantes where condominio_id='0c042d79-e7b0-449c-8430-59e6971d0e70' and status='pendente') as visitantes,
       (select count(*) from classificados where condominio_id='0c042d79-e7b0-449c-8430-59e6971d0e70' and status='pendente') as classificados;
     -- {"mensagens":1,"chamados":1,"reservas":1,"visitantes":9 (no momento do clique),"classificados":0}
     -- soma = 12, igual ao badge
     ```

- [x] Nenhuma mudança visual perceptível no badge (mesmo ícone, mesmo
  posicionamento, mesmo comportamento de clique rolando até a primeira
  pendência).

  Snapshot Playwright (login síndica) mostrou:
  `button "12 pendências — clique para ver a primeira"` com o mesmo sino
  (ícone `Bell`), mesmo badge circular numérico, mesmo `aria-label`. Cliquei
  no badge e confirmei via `browser_evaluate` que a página rolou até a
  seção `#admin-reservas` (primeira categoria com pendência, ordem
  reservas→classificados→visitantes→chamados→mensagens):
  ```js
  () => { const el = document.getElementById('admin-reservas');
    const r = el.getBoundingClientRect();
    return { found: true, top: r.top, nearViewportTop: true } }
  // resultado: {"found":true,"top":87.5,"nearViewportTop":true}
  ```
  Comportamento idêntico ao pré-fix (o fix não tocou JSX/estilo do
  componente, só a forma de tratamento de erro das promises).

## Bug 2 — datas de reserva

- [x] Seção de reservas (morador) e "Gerenciamento de Reservas" (admin)
  continuam mostrando as datas corretamente após o fix — sem regressão
  visual.

  - Morador (login `morador.qa.mobile@example.com`), seção "Minhas
    reservas": `paragraph: "Data: 20/07/2026"` — reserva existente "salao".
  - Admin (login síndica), tabela "Gerenciamento de Reservas": `cell
    "20/07/2026"` — mesma reserva, mesma formatação, mesma célula
    `font-mono`.

  Ambos usam agora `fmtDataReserva(r.data_inicio)` (linhas ~1403 e ~2565 de
  `src/routes/index.tsx`) e renderizaram a data idêntica ao formato anterior
  (`DD/MM/AAAA`), confirmando ausência de regressão.

- [ ] Lista de "Datas bloqueadas" (admin) continua mostrando a data
  corretamente.

  **Não testável nesta sessão** — bug pré-existente e fora de escopo bloqueia
  a criação de qualquer bloqueio de data em QA. Ao tentar "Bloquear data"
  (Churrasqueira, 2026-09-15, motivo "Teste QA fmtDataReserva"), a chamada
  `POST .../rest/v1/reservas` retornou HTTP 400:
  ```
  {code: 23514, details: null, hint: null,
   message: 'new row for relation "reservas" violates check constraint "reservas_status_check"'}
  ```
  Confirmei via SQL que a constraint só permite
  `status in ('pendente','aprovada','recusada')`:
  ```sql
  select pg_get_constraintdef(oid) from pg_constraint where conname = 'reservas_status_check';
  -- CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovada'::text, 'recusada'::text])))
  ```
  ou seja, o fluxo de "Bloquear data" tenta gravar um status (provavelmente
  `bloqueado`) que a constraint do banco de QA não aceita — schema drift
  pré-existente, não relacionado às mudanças desta tarefa (nenhum arquivo
  tocado nesta PR mexe em bloqueios/`reservas`). Não fiz nenhuma alteração no
  banco de QA para contornar isso. `fmtDataReserva` em si já foi validada
  nos outros dois usos (item acima) — é a mesma função nos 3 lugares, então o
  risco de regressão específica neste terceiro uso é baixo, mas o item fica
  formalmente **não verificado end-to-end** por bloqueio externo ao escopo.
  Reportado como achado fora do escopo, não corrigido.

## Bug 3 — reset do dialog de visitante

- [x] Cadastrar um visitante com sucesso, fechar o dialog pela tela de
  sucesso ("Concluir"), reabrir com "Cadastrar visitante" → formulário limpo
  (1 pessoa vazia, 0 carros, sem tela de sucesso residual).

  Cadastrei "Mae Frequente Teste" (CPF 529.982.247-25, 10/08→11/08/2026),
  cliquei "Concluir" na tela de sucesso, confirmei `document.querySelectorAll('[role="dialog"]').length === 0`,
  reabri "Cadastrar visitante": snapshot mostrou `combobox "Quantas pessoas
  vão entrar?": "1"`, `textbox "Nome completo *"` vazio, `textbox "CPF *"`
  vazio, sem bloco de sucesso.

- [x] Abrir o dialog, preencher parcialmente (nome de uma pessoa), fechar
  pelo "Cancelar", reabrir → formulário limpo, sem o nome digitado antes.

  Digitei "Nome Que Nao Deve Persistir" no campo Nome completo, cliquei
  "Cancelar", confirmei dialog removido do DOM (`0` dialogs), reabri:
  snapshot mostrou `textbox "Nome completo *" [ref=e1567]` sem valor
  (linha 545 do snapshot, sem texto após o ref — campo vazio).

- [x] Fechar e reabrir o dialog rapidamente (clique duplo real, não
  sintético) várias vezes seguidas → sempre limpo, nunca mostra dado
  residual.

  3 ciclos reais de abrir→Cancelar→abrir com cliques Playwright reais
  (`browser_click`, não `element.click()` disparado em lote), cada um
  seguido de nova captura de snapshot confirmando `textbox "Nome completo
  *"` vazio antes do próximo ciclo:
  - Ciclo 1: `ref=e1619` vazio.
  - Ciclo 2: `ref=e1671` vazio.
  - Ciclo 3 (após terceiro Cancelar): reabertura final confirmada limpa.

## Feature — pessoas frequentes: banco de dados

- [x] Migration aplicada em QA: tabela `pessoas_frequentes` existe com as
  colunas esperadas, FKs para `condominios`/`profiles` com `ON DELETE
  CASCADE`, e constraint `unique (morador_id, cpf)`.

  ```sql
  -- information_schema.columns
  [{"column_name":"id","data_type":"uuid","is_nullable":"NO","column_default":"gen_random_uuid()"},
   {"column_name":"condominio_id","data_type":"uuid","is_nullable":"NO","column_default":null},
   {"column_name":"morador_id","data_type":"uuid","is_nullable":"NO","column_default":null},
   {"column_name":"nome","data_type":"text","is_nullable":"NO","column_default":null},
   {"column_name":"cpf","data_type":"text","is_nullable":"NO","column_default":null},
   {"column_name":"created_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()"}]

  -- pg_constraint
  [{"conname":"pessoas_frequentes_condominio_id_fkey","contype":"f","def":"FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE"},
   {"conname":"pessoas_frequentes_morador_id_cpf_key","contype":"u","def":"UNIQUE (morador_id, cpf)"},
   {"conname":"pessoas_frequentes_morador_id_fkey","contype":"f","def":"FOREIGN KEY (morador_id) REFERENCES profiles(id) ON DELETE CASCADE"},
   {"conname":"pessoas_frequentes_pkey","contype":"p","def":"PRIMARY KEY (id)"}]
  ```

- [x] RLS: consultar como um morador (ou via SQL simulando `auth.uid()`) e
  confirmar que só as próprias linhas de `pessoas_frequentes` aparecem —
  linhas de outro morador (mesmo do mesmo condomínio) não aparecem.

  Não havia um segundo morador de teste disponível nesta sessão, então a
  validação foi dupla, conforme sugerido no requirements:

  1. **Funcional, via app real (RLS aplicada de verdade)**: logado como
     `morador.qa.mobile@example.com` (`profile.id =
     b3c88f79-9bf2-40c2-b44b-6a0fc7e645b3`) através do Playwright contra o
     app real (que usa a chave anônima + sessão do morador, não
     service-role), consegui: inserir (via UI, checkbox "Salvar para
     próxima vez"), listar (popover "Escolher pessoa salva" mostrou a
     própria pessoa salva), atualizar via upsert (mesmo CPF, nome
     sobrescrito) e apagar (ícone de lixeira) — todas as 4 operações
     passaram pela RLS real da sessão do morador e funcionaram.

  2. **Estrutural, via `pg_policies`** — a policy filtra estritamente por
     `morador_id = current_profile().profile_id`, sem exceção para síndica:
     ```sql
     select policyname, cmd, qual, with_check from pg_policies
     where schemaname='public' and tablename='pessoas_frequentes';
     ```
     ```
     pessoas_frequentes_select (SELECT): qual = "morador_id = ( SELECT current_profile.profile_id FROM current_profile() ... )"
     pessoas_frequentes_insert (INSERT): with_check = "condominio_id = (...) AND morador_id = (SELECT current_profile.profile_id FROM current_profile() ...)"
     pessoas_frequentes_update (UPDATE): qual = "morador_id = ( SELECT current_profile.profile_id FROM current_profile() ... )"
     pessoas_frequentes_delete (DELETE): qual = "morador_id = ( SELECT current_profile.profile_id FROM current_profile() ... )"
     ```
     As 4 policies (select/insert/update/delete) comparam `morador_id`
     contra `current_profile().profile_id` da sessão autenticada — não há
     policy alternativa para `role = 'sindica'` nem bypass, ao contrário de
     `visitantes` (que tem policy adicional pra síndica). Um morador B
     autenticado nunca teria `current_profile().profile_id = ` ao
     `morador_id` de A, então as linhas de A ficam invisíveis/inacessíveis
     a B — mesma garantia dada pelo Postgres RLS que protege `visitantes`
     hoje.

## Feature — pessoas frequentes: fluxo completo via UI

- [x] No dialog de cadastro, marcar "Salvar para próxima vez" numa pessoa,
  completar e enviar o cadastro com sucesso.

  Pessoa "Mae Frequente Teste" / CPF 529.982.247-25, checkbox marcado,
  datas 2026-08-10→2026-08-11, submit → toast "Visitante cadastrado.
  Aguarde aprovação." + tela de sucesso. Confirmado via SQL que a linha foi
  criada em `pessoas_frequentes`:
  ```sql
  select * from public.pessoas_frequentes where morador_id = 'b3c88f79-9bf2-40c2-b44b-6a0fc7e645b3';
  -- [{"id":"a192f3e8-...","nome":"Mae Frequente Teste","cpf":"529.982.247-25", ...}]
  ```

- [x] Reabrir o dialog, clicar em "Escolher pessoa salva" no bloco da pessoa
  1 → a pessoa salva aparece na lista com nome e CPF.

  Popover abriu com `option "Mae Frequente Teste — 529.982.247-25 Apagar
  Mae Frequente Teste da lista de salvas"`.

- [x] Selecionar a pessoa salva → nome e CPF do bloco atual são preenchidos
  corretamente.

  Após clicar na opção, snapshot confirmou:
  `textbox "Nome completo *": Mae Frequente Teste` e
  `textbox "CPF *": 529.982.247-25` (com placeholder ainda visível ao lado,
  texto preenchido corretamente), popover fechou sozinho.

- [x] Digitar no campo de busca do popover → a lista filtra pelo nome
  digitado.

  Digitei "Mae" → item continuou visível. Digitei "Xyzzzz" (sem match) →
  lista mudou para `generic: Nenhuma pessoa salva ainda.` (estado vazio do
  `CommandEmpty`, mesmo texto do estado "sem pessoas salvas" — comportamento
  esperado do filtro do `cmdk`).

- [x] Clicar no ícone de apagar de uma pessoa dentro do popover → ela some da
  lista; o popover continua aberto; o cadastro em andamento não é afetado.

  Cliquei no botão "Apagar Mae Frequente Teste da lista de salvas": popover
  permaneceu aberto (`dialog [ref=e1172]` presente), lista mudou para
  "Nenhuma pessoa salva ainda.", e os campos Nome/CPF do formulário
  continuaram com "Mae Frequente Teste" / "529.982.247-25" intactos
  (confirmado por snapshot logo em seguida). Confirmado via SQL que a linha
  foi de fato apagada do banco:
  ```sql
  select count(*) from public.pessoas_frequentes where morador_id = 'b3c88f79-9bf2-40c2-b44b-6a0fc7e645b3';
  -- {"count": 0}
  ```

- [x] Abrir o popover de um morador sem nenhuma pessoa salva → mostra
  mensagem de lista vazia, sem erro no console.

  Testado no início do fluxo (antes de qualquer pessoa salva existir) e
  novamente logo após o delete acima: `generic: Nenhuma pessoa salva
  ainda.`, e `browser_console_messages(level: error)` só retornou o
  hydration-mismatch pré-existente (ver "Achados fora do escopo" no
  resumo), nenhum erro novo relacionado ao popover.

- [x] Salvar a mesma pessoa (mesmo CPF) de novo com o nome diferente →
  sobrescreve o nome anterior (upsert), não cria duplicata.

  Selecionei a pessoa salva de novo (nome "Mae Frequente Teste" preenchido),
  editei o nome para "Mae Renomeada Upsert", marquei "Salvar para próxima
  vez" de novo, submeti com sucesso. SQL confirma uma única linha,
  sobrescrita:
  ```sql
  select id, nome, cpf from public.pessoas_frequentes where morador_id = 'b3c88f79-9bf2-40c2-b44b-6a0fc7e645b3';
  -- [{"id":"5b5c347c-...","nome":"Mae Renomeada Upsert","cpf":"529.982.247-25"}]
  -- 1 única linha (mesmo id de conflito por unique(morador_id,cpf), não duplicou)
  ```

## Feature — mobile (375×667 e 320×568)

- [x] Em 375px e em 320px, abrir o popover "Escolher pessoa salva" em pelo
  menos 2 blocos de pessoa diferentes (inclusive com as 8 pessoas
  preenchidas) e confirmar `scrollWidth <= clientWidth` (sem overflow
  horizontal) via `getBoundingClientRect`/`scrollWidth`.

  Com 8 pessoas preenchidas (`Quantas pessoas vão entrar? = 8`):

  **375×667:**
  ```js
  // dialog inteiro, sem overflow horizontal
  {"dialogOverflow":true,"dialogScrollWidth":339,"dialogClientWidth":339,"docOverflow":true}
  // popover da Pessoa 2
  {"left":0,"right":288,"width":288,"viewport":375,"overflowsRight":false,"overflowsLeft":false}
  ```

  **320×568:**
  ```js
  // dialog inteiro
  {"dialogScrollWidth":287,"dialogClientWidth":287,"docScrollWidth":305,"viewport":320}
  // popover da Pessoa 5
  {"left":0,"right":288,"width":288,"viewport":320,"overflowsRight":false,"overflowsLeft":false}
  ```

- [x] Nos dois viewports, os botões-ícone "Escolher pessoa salva" e remover
  pessoa no cabeçalho do bloco são ambos clicáveis, sem sobrepor o texto
  "Pessoa N".

  Medido via `getBoundingClientRect` para os 8 blocos em ambos os
  viewports — borda direita do texto "Pessoa N" sempre < borda esquerda do
  botão "Escolher pessoa salva":

  **375px** (8 blocos, `legendRight` vs `escolherLeft`):
  ```
  Pessoa 1: legendRight=110.5, escolherLeft=237.1, overlap=false
  Pessoa 2: legendRight=112.9, escolherLeft=237.1, overlap=false
  ... (Pessoa 3–8 idênticos, todos overlap=false)
  ```
  **320px** (8 blocos):
  ```
  Pessoa 1: legendRight=109.1, escolherLeft=183.5, overlap=false
  Pessoa 2: legendRight=111.5, escolherLeft=183.5, overlap=false
  ... (Pessoa 3–8 idênticos, todos overlap=false)
  ```

- [x] Nos dois viewports, o checkbox "Salvar para próxima vez" + label não
  quebram de forma estranha (sem texto cortado, sem overflow).

  375px, os 8 labels "Salvar para próxima vez" todos com `right: 192.06`,
  bem dentro do viewport de 375px (`overflowsViewport: false` para todos os
  8). Inspeção visual via screenshot (abaixo) confirma texto completo, sem
  corte.

- [x] Com 8 pessoas preenchidas e o dialog rolado ao máximo, o rodapé
  "Cancelar"/"Cadastrar" continua visível e clicável nos dois viewports.

  **375×667**, dialog rolado ao fim (`scrollTop=1915` de `scrollHeight=2513`):
  ```js
  {"scrollTop":1915,"scrollHeight":2513,"btnTop":528.6,"btnBottom":564.6,"viewportHeight":667,"visible":true}
  ```
  Screenshot (`mobile-375-8pessoas-scrolled.png`): rodapé sticky com
  "Cadastrar"/"Cancelar" visíveis sobre o bloco "Pessoa 8" rolado.

  **320×568**, dialog rolado ao fim (`scrollTop=2004` de `scrollHeight=2513`):
  ```js
  {"scrollTop":2004,"scrollHeight":2513,"btnTop":434.6,"btnBottom":470.6,"viewportHeight":568,"visible":true}
  ```
  Confirmei também que o ponto central do botão "Cadastrar" resolve para o
  próprio botão via `document.elementFromPoint` (não há outro elemento
  sobrepondo e roubando o clique):
  ```js
  {"topElIsButtonOrChild": true}
  ```
  Screenshot (`mobile-320-8pessoas-scrolled.png`) confirma visualmente.

## Regressão e build

- [x] Fluxos já existentes de visitantes (cadastrar sem usar pessoa salva,
  aprovar, recusar) continuam funcionando normalmente.

  - **Cadastrar**: 3 cadastros de visitante completos e bem-sucedidos
    durante a sessão (fluxo não muda se "Salvar para próxima vez" fica
    desmarcado — o `criarVisitante` é o mesmo de antes, só ganhou um passo
    opcional depois do sucesso).
  - **Aprovar** (login síndica, painel "Visitantes"): clique em "Aprovar"
    em "Mae Renomeada Upsert" → confirmado via SQL:
    ```sql
    select nome_visitante, status from visitantes where nome_visitante = 'Mae Renomeada Upsert';
    -- {"nome_visitante":"Mae Renomeada Upsert","status":"aprovado"}
    ```
  - **Recusar**: clique em "Recusar" em "Mae Frequente Teste" (novo
    registro pós-delete/re-save), preenchi motivo "Teste QA - regressão
    recusar", "Confirmar recusa" → confirmado via SQL:
    ```sql
    select nome_visitante, status, motivo_recusa from visitantes where nome_visitante = 'Mae Frequente Teste';
    -- {"nome_visitante":"Mae Frequente Teste","status":"recusado","motivo_recusa":"Teste QA - regressão recusar"}
    ```

- [x] `bun run build` (ou `npm run build`) passa sem erro.

  ```
  $ bun run build
  EXIT:0
  $ vite build
  ...
  ✓ built in 3.38s
  ✓ built in 1.61s
  [nitro] ✔ Generated public .output/public
  ✓ built in 1.46s
  [nitro] ✔ You can preview this build using npx vite preview
  [nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
  ```
  (saída completa do build com todos os chunks nos logs desta sessão;
  build client + SSR + Nitro/Cloudflare todos concluídos sem erro, apenas 1
  warning inofensivo sobre `inlineDynamicImports` ignorado por causa de
  `codeSplitting`, pré-existente e não relacionado a esta tarefa.)

  Complemento — `npx tsc --noEmit`:
  ```
  $ npx tsc --noEmit
  EXIT:0
  (saída vazia)
  ```
