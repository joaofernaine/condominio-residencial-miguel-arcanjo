# Test Plan — Lista de moradores agrupada por bloco (síndica)

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

- [x] Login como síndica em produção (joaovftoledo1@gmail.com). Ao carregar
      o painel, a seção "Unidades & cobranças" mostra os grupos de bloco
      (ex.: "Bloco A", "Bloco B") todos FECHADOS por padrão — nenhuma linha
      de morador individual visível antes de clicar.

  Testado via Playwright MCP navegando para http://localhost:8081 (sessão
  da síndica já autenticada, "Sair" e "Painel da Síndica" visíveis no
  header). Snapshot de acessibilidade da seção "Unidades & cobranças" logo
  após o carregamento (contadores: Em dia 0, Pendentes 44, Atrasados 0):

  ```yaml
  - generic [ref=f81e57]:
    - generic [ref=f81e58]:
      - generic [ref=f81e59]:
        - generic [ref=f81e60]: Situação financeira
        - heading "Unidades & cobranças" [level=2] [ref=f81e64]
        - paragraph [ref=f81e65]: Clique em uma linha para editar o histórico mensal (2026).
      - generic [ref=f81e66]:
        - button "Importar relatório financeiro" [ref=f81e67]
        - button "Cadastrar morador" [ref=f81e68]
    - generic [ref=f81e279]:
      - button "Bloco A · 18 unidades" [ref=f81e281]:
        - generic [ref=f81e282]:
          - text: Bloco A
          - generic [ref=f81e283]: · 18 unidades
      - button "Bloco B · 26 unidades" [ref=f81e287]:
        - generic [ref=f81e288]:
          - text: Bloco B
          - generic [ref=f81e289]: · 26 unidades
  ```

  Nenhum atributo `[expanded]` nos botões e nenhuma `list`/`listitem` de
  moradores presente — ambos os grupos começam fechados, exatamente 18
  unidades no Bloco A e 26 no Bloco B como esperado.

- [x] Clicar no cabeçalho "Bloco A" expande e mostra as unidades desse
      bloco em ordem numérica crescente pelo apartamento (ex.: A-107, A-108,
      A-109, A-110, A-207, ... não fora de ordem).

  Clique em `button "Bloco A · 18 unidades"` via
  `browser_click` → `page.getByRole('button', { name: 'Bloco A · 18 unidades' }).click()`.
  Snapshot resultante mostra `[expanded]` no botão e uma `list` com 18
  `listitem`, na sequência (parágrafo do número da unidade em cada item):

  A-107, A-108, A-109, A-110, A-207, A-208, A-209, A-210, A-307, A-308,
  A-309, A-310, A-407, A-408, A-409, A-410, A-508, A-509

  Ordem crescente confirmada, idêntica à esperada no cenário. Bloco B
  permaneceu fechado (sem `list`) durante esse passo, confirmando que os
  grupos expandem/colapsam de forma independente.

- [x] Clicar novamente no cabeçalho "Bloco A" colapsa o grupo de volta.

  Segundo clique no mesmo botão (`browser_click` no ref f81e281). Snapshot
  pós-clique:

  ```yaml
  - generic [ref=f81e279]:
    - button "Bloco A · 18 unidades" [active] [ref=f81e281]:
      - generic [ref=f81e282]:
        - text: Bloco A
        - generic [ref=f81e283]: · 18 unidades
    - button "Bloco B · 26 unidades" [ref=f81e287]:
      - generic [ref=f81e288]:
        - text: Bloco B
        - generic [ref=f81e289]: · 26 unidades
  ```

  Atributo `[expanded]` e a `list` de moradores desapareceram — grupo
  colapsado com sucesso.

- [x] Clicar no cabeçalho "Bloco B" expande e mostra as unidades desse
      bloco em ordem numérica crescente (ex.: B-101, B-102, ..., B-106,
      B-201, ...).

  Clique em `button "Bloco B · 26 unidades"` (ref f81e287). Snapshot
  resultante mostra `[expanded]` no botão e `list` com 26 `listitem`, na
  sequência:

  B-101, B-102, B-103, B-104, B-105, B-106, B-201, B-202, B-203, B-204,
  B-205, B-206, B-301, B-302, B-303, B-304, B-305, B-306, B-401, B-402,
  B-403, B-404, B-405, B-406, B-503, B-504

  Ordem crescente confirmada, idêntica à esperada no cenário (26 itens).

- [x] Com um bloco expandido, clicar em uma linha/card de morador ainda
      abre o diálogo de histórico mensal corretamente (comportamento
      existente preservado).

  Primeira tentativa clicando no centro do `listitem` da unidade B-101
  acabou acionando o botão "Editar" dentro da linha (abriu o diálogo
  "Editar morador" — comportamento correto do botão, mas não o que este
  item testa). Fechado esse diálogo e repetido o clique mirando
  especificamente o parágrafo "B-101" (fora da área dos botões de ação),
  o que abriu o diálogo esperado:

  ```yaml
  - dialog [ref=f81e1032]:
    - generic [ref=f81e1033]:
      - heading "Histórico de pagamentos — B-101" [level=2] [ref=f81e1034]
      - paragraph [ref=f81e1035]: Igor Luiz Vasconcellos Zanetti · Ano 2026. Altere o status retroativamente.
    - generic [ref=f81e1036]:
      - generic [ref=f81e1037]:
        - paragraph [ref=f81e1039]: Jan
        - combobox [active] [ref=f81e1040]: Sem registro
      ... (Fev a Dez, com "Ago" marcado como "Atual" e Set-Dez como "A faturar")
    - button "Close" [ref=f81e1108]
  ```

  Diálogo de histórico mensal abre corretamente ao clicar na linha
  (fora dos botões de ação). Diálogo fechado em seguida via botão Close.

- [x] Redimensionar para viewport mobile (ou usar device emulation) e
      repetir a checagem de agrupamento/ordenação/expandir-colapsar no
      layout de cards mobile.

  `browser_resize` para 375x800. Com Bloco B ainda expandido do passo
  anterior (estado preservado ao redimensionar, sem reload), o snapshot
  confirmou os mesmos 26 itens de B-101 a B-504 na mesma ordem. Colapsado
  Bloco B e expandido Bloco A: snapshot confirmou novamente a sequência
  A-107, A-108, A-109, A-110, A-207... corretamente ordenada em viewport
  mobile.

  Screenshot (375x800, Bloco A expandido) confirma visualmente o layout de
  cards mobile (não mais tabela): card branco por unidade com número
  "A-107" / "A-108" / "A-109", nome do morador, badge "Pendente" e botões
  "Histórico" / "Editar" / "Excluir"; cabeçalho "Bloco A · 18 unidades" com
  seta (chevron) apontando para cima indicando expandido. Screenshot salvo
  em `mobile-bloco-a-expanded.png`.

  Em seguida, colapsado o Bloco A: screenshot (`mobile-blocos-collapsed.png`)
  confirma os dois cabeçalhos "Bloco A · 18 unidades" e "Bloco B · 26
  unidades" lado a lado, ambos com chevron apontando para baixo e nenhum
  card de morador visível entre eles — comportamento de agrupamento/
  expandir-colapsar preservado no layout mobile.

- [x] Recarregar a página (F5) com um bloco previamente expandido: após o
      reload, os grupos voltam a aparecer fechados por padrão.

  Com Bloco A expandido (confirmado `[expanded]` no snapshot antes do
  reload), executado `browser_navigate` para a mesma URL
  (http://localhost:8081) simulando reload completo da página. Após aguardar
  o texto "Bloco A" ficar visível novamente, snapshot pós-reload:

  ```yaml
  - generic [ref=f82e70]:
    - button "Bloco A · 18 unidades" [ref=f82e72]:
      - generic [ref=f82e73]:
        - text: Bloco A
        - generic [ref=f82e74]: · 18 unidades
    - button "Bloco B · 26 unidades" [ref=f82e78]:
      - generic [ref=f82e79]:
        - text: Bloco B
        - generic [ref=f82e80]: · 26 unidades
  ```

  Nenhum `[expanded]`, nenhuma `list` de moradores — ambos os grupos
  voltaram ao estado fechado por padrão após o reload, mesmo o Bloco A
  tendo sido deixado expandido antes de recarregar.

- [x] Abrir o diálogo "Editar morador" de uma unidade qualquer (ex.: A-108)
      e confirmar que ele mostra Nome completo, Bloco (dropdown) e
      Apartamento (input) — não mais um campo único "Unidade" de texto
      livre — pré-preenchidos corretamente com os dados atuais.

  Login já ativo (síndica, produção). Expandido "Bloco A · 18 unidades" via
  `browser_click`, localizada a linha "A-108" (morador "Rose Nair Guellis e
  Donizeti Pestana") via `browser_find`, e clicado no botão "Editar" dessa
  linha. Snapshot de acessibilidade do diálogo aberto:

  ```yaml
  - dialog [ref=f84e908]:
    - generic [ref=f84e909]:
      - heading "Editar morador" [level=2] [ref=f84e910]
      - paragraph [ref=f84e911]: Atualize nome e unidade.
    - generic [ref=f84e912]:
      - generic [ref=f84e913]:
        - text: Nome completo
        - textbox "Nome completo" [active] [ref=f84e914]: Rose Nair Guellis e Donizeti Pestana
      - generic [ref=f84e915]:
        - generic [ref=f84e916]:
          - text: Bloco
          - combobox "Bloco" [ref=f84e917] [cursor=pointer]:
            - generic: A
          - combobox [ref=f84e920]
        - generic [ref=f84e921]:
          - text: Apartamento
          - textbox "Apartamento" [ref=f84e922]:
            - /placeholder: "Ex.: 301"
            - text: "108"
      - button "Salvar" [ref=f84e923] [cursor=pointer]
    - button "Close" [ref=f84e924] [cursor=pointer]
  ```

  Confirmado: campo "Nome completo" (texto) + "Bloco" (combobox, valor "A")
  + "Apartamento" (input texto, valor "108") — não existe mais um campo
  único "Unidade" de texto livre. Todos os três pré-preenchidos
  corretamente com os dados reais de A-108.

- [x] No diálogo "Editar morador", trocar o bloco e/ou apartamento, salvar,
      e confirmar que a unidade mudou corretamente na lista (a linha some
      do grupo antigo e aparece no grupo novo, na posição numérica certa).
      Desfazer a mudança em seguida (voltar pro valor original) pra não
      deixar dado de teste em produção.

  No mesmo diálogo do item anterior, preenchido "Apartamento" com "999"
  (via `browser_fill_form`) mantendo Bloco "A", e clicado "Salvar". Após o
  save, `browser_find` por "A-999" confirmou a linha presente com o mesmo
  morador ("Rose Nair Guellis e Donizeti Pestana"). Snapshot da tabela
  completa do grupo Bloco A pós-save (trecho relevante):

  ```yaml
  - row [ref=f84e1111] [cursor=pointer]:
    - cell "A-509" ...
  - row [ref=f84e1121] [cursor=pointer]:
    - cell "A-999" [ref=f84e1122]
    - cell "Rose Nair Guellis e Donizeti Pestana" [ref=f84e1123]
    - cell "Pendente" [ref=f84e1124]
  - row [ref=f84e1131] [cursor=pointer]:
    - cell "Bloco B · 26 unidades" ...
  ```

  Confirmado: "A-108" desapareceu da lista (sequência ficou A-107, A-109,
  A-110, ...) e "A-999" apareceu na posição numérica correta — última linha
  do grupo Bloco A (999 é o maior número), contagem do cabeçalho manteve
  "18 unidades".

  Desfazendo: aberto "Editar" na linha A-999, confirmado no snapshot do
  diálogo que "Apartamento" mostrava "999" e "Bloco" mostrava "A", alterado
  "Apartamento" de volta para "108" e clicado "Salvar". `browser_find` por
  "A-108" confirmou a linha restaurada com o mesmo morador. Snapshot final
  da tabela completa do grupo Bloco A confirma a sequência original intacta
  (A-107, A-108, A-109, A-110, A-207, A-208, A-209, A-210, A-307, A-308,
  A-309, A-310, A-407, A-408, A-409, A-410, A-508, A-509 — 18 unidades,
  sem A-999). Produção restaurada ao estado original, sem dado de teste
  residual.

- [x] Abrir o diálogo "Histórico de pagamentos" de uma unidade (ex.: clicar
      na linha A-108, fora dos botões de ação) e confirmar visualmente que
      os 12 meses aparecem como blocos com cor sólida por status (verde
      "Em dia", vermelho "Atrasado", dourado "Pendente", cinza tracejado
      pra "Sem registro"/"A faturar"), com uma linha de resumo no topo
      ("X de Y meses em dia · ...") e uma legenda de cores no rodapé do
      grid. O mês atual mantém o selo "Atual".

  Login já ativo (síndica, produção). Expandido "Bloco A · 18 unidades" via
  `browser_click`, localizada a linha "A-108" via `browser_find` e clicado
  na célula "A-108" (fora dos botões "Editar"/"Excluir"), o que abriu o
  diálogo esperado. **Nenhum combobox de mês foi clicado/alterado** — apenas
  snapshot de acessibilidade e screenshot, depois fechado via botão "Close".

  Snapshot de acessibilidade do diálogo:

  ```yaml
  - dialog [ref=f87e725]:
    - generic [ref=f87e726]:
      - heading "Histórico de pagamentos — A-108" [level=2] [ref=f87e727]
      - paragraph [ref=f87e728]: Rose Nair Guellis e Donizeti Pestana · Ano 2026. Altere o status retroativamente.
    - generic [ref=f87e729]:
      - strong [ref=f87e730]: 0 de 8 meses em dia
      - generic [ref=f87e731]: · 8 sem registro
    - generic [ref=f87e732]:
      - generic [ref=f87e733]:
        - paragraph [ref=f87e735]: Jan
        - combobox [active] [ref=f87e736] [cursor=pointer]:
          - generic: Sem registro
      - generic [ref=f87e739]:
        - paragraph [ref=f87e741]: Fev
        - combobox [ref=f87e742] [cursor=pointer]:
          - generic: Sem registro
      ... (Mar a Jul iguais, "Sem registro")
      - generic [ref=f87e775]:
        - generic [ref=f87e776]:
          - paragraph [ref=f87e777]: Ago
          - generic [ref=f87e778]: Atual
        - combobox [ref=f87e779] [cursor=pointer]:
          - generic: Sem registro
      - generic [ref=f87e782]:
        - paragraph [ref=f87e784]: Set
        - paragraph [ref=f87e785]: A faturar
      ... (Out a Dez iguais, "A faturar")
    - generic [ref=f87e798]:
      - generic [ref=f87e799]: Em dia
      - generic [ref=f87e801]: Atrasado
      - generic [ref=f87e803]: Pendente
      - generic [ref=f87e805]: A faturar
    - generic [ref=f87e807]:
      - paragraph [ref=f87e808]: Edição registrada
      - paragraph [ref=f87e812]: Alterações são gravadas no banco imediatamente e ficam disponíveis para auditoria.
    - button "Close" [ref=f87e813] [cursor=pointer]
  ```

  Screenshot (`historico-pagamentos-a108.png`) confirma visualmente: título
  "Histórico de pagamentos — A-108", linha de resumo "0 de 8 meses em dia ·
  8 sem registro", os 12 blocos de mês em grade 4x3 com fundo cinza e borda
  tracejada para Jan-Ago ("Sem registro", com Ago destacado com contorno azul
  e badge "ATUAL") e Set-Dez em itálico ("A faturar"), e a legenda de cores
  no rodapé com 4 bolinhas coloridas: verde/teal "Em dia", vermelho
  "Atrasado", dourado/laranja "Pendente", cinza claro "A faturar".

  Observação: como esta unidade (e o condomínio inteiro no momento — painel
  mostra "Em dia: 0" e "Atrasados: 0" nos contadores gerais) não possui
  nenhum mês já marcado como "Em dia"/"Atrasado"/"Pendente" em registro real,
  não foi possível ver um bloco JÁ preenchido com essas 3 cores específicas
  sem alterar dado (o que era proibido nesta tarefa) — confirmado visualmente
  o padrão cinza tracejado ("Sem registro"), o itálico "A faturar", o selo
  "Atual" e a legenda com as 4 cores mapeadas corretamente. Diálogo fechado
  em seguida via botão "Close", sem clicar em nenhum combobox de mês.

- [ ] Trocar o status de UM mês sem registro (ex.: um mês qualquer que não
      seja o atual) pra "Em dia", salvar, e confirmar visualmente que o
      card daquele mês vira um bloco sólido colorido (não mais um card
      branco com select por dentro) — tirar screenshot como evidência.
      Em seguida, **reverter obrigatoriamente**: como não existe opção de
      "limpar"/voltar pra "sem registro" na UI, isso precisa ser desfeito
      via SQL diretamente no banco de PRODUÇÃO (delete na tabela
      `historico_financeiro` pelo `unidade_id` da unidade testada + ano +
      mês usados no teste) — não deixe esse dado de teste residual em
      produção. Documente aqui a query usada e confirme que, após rodar,
      reabrir o diálogo mostra aquele mês de volta como "Sem registro".
  <saída crua aqui>

  Nota do implementador (não conta como check de QA — quem editou o
  código não marca; deixado como `[ ]` de propósito): esse item foi
  verificado manualmente por mim antes de acionar o QA, porque o agente
  de QA não tem acesso a SQL nesta sessão pra reverter uma mutação em
  produção sem opção de "limpar" pela UI — não seria seguro pedir pra ele
  mudar dado real sem ter como desfazer sozinho. Marquei Jan/2026 da
  unidade A-108 como "Em dia (Pago)" via UI e confirmei visualmente (print)
  que o card virou um bloco sólido teal com texto escuro, no mesmo padrão
  do heatmap do morador. Revertido em seguida com:

  ```sql
  delete from public.historico_financeiro hf
  using public.profiles p
  where hf.unidade_id = p.id
    and p.unidade = 'A-108'
    and hf.ano = 2026
    and hf.mes = 1;
  ```

  Rodado pelo usuário no SQL Editor de produção (confirmou "success").
  Reabri o diálogo depois: resumo voltou a "0 de 8 meses em dia · 8 sem
  registro", Jan de volta a "Sem registro" — sem dado residual. Se quiser
  uma verificação independente por QA de verdade, dá pra repetir isso
  contra o banco de QA (onde mutação e revert são seguros) em vez de
  produção.
