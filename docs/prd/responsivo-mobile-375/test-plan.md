# Test Plan — responsivo-mobile-375

> NOTA (implementador, 2026-07-20): auditoria feita com Playwright real
> (viewport 375x667) em: landing pública deslogada, dialog de login,
> painel da síndica logado (incluindo dados de teste seedados no Supabase
> de QA — morador com nome longo, histórico financeiro atrasado, chamado,
> visitante e pauta com textos longos, para forçar estresse de layout),
> dialogs "Cadastrar morador"/"Nova amenidade", portal do morador (com o
> mesmo morador de teste), e as rotas standalone `/classificados/novo`,
> `/admin/classificados`, `/admin/classificados/pendentes`. Em todos os
> casos `document.documentElement.scrollWidth == clientWidth` (sem
> rolagem horizontal da página) e nenhum "card sambando" real foi
> encontrado. **Nenhuma mudança de código foi necessária** — o app já
> usa `w-[95vw] max-w-lg` nos dialogs (`src/components/ui/dialog.tsx`),
> `overflow-auto` contido nas tabelas (`src/components/ui/table.tsx`, ex.
> "Unidades & cobranças" e "Gerenciamento de Reservas" em
> `src/routes/index.tsx:1768` e `:2465` — rolam horizontalmente dentro do
> próprio card em vez de estourar a página) e todas as `<img>` já usam
> `h-full w-full object-cover` dentro de containers com tamanho
> controlado. QA deve rodar os itens abaixo de forma independente com
> Playwright para confirmar — este check já feito pelo implementador não
> substitui o do QA.
>
> Achado à parte (fora do escopo desta tarefa, não é bug de layout):
> durante a auditoria, ao inserir uma reserva de teste real, a seção
> "Gerenciamento de Reservas" (admin) quebrou a página inteira com
> `TypeError: Cannot read properties of undefined (reading 'split')` —
> a tabela `reservas` no Supabase tem a coluna `data_reserva`, mas
> `src/lib/portal-data.ts` seleciona e lê `data_inicio` (coluna que não
> existe). O mesmo padrão de drift já era conhecido para `obras.descricao`
> (não existe na tabela `obras`) e aparentemente afeta o carregamento de
> votações também. Nenhum desses três é um bug de responsividade — são
> bugs de schema drift que merecem seu próprio requirements.md se o
> usuário quiser corrigi-los.

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

> Todos os itens de UI devem ser verificados com o viewport do Playwright
> fixado em **375x667** (`browser_resize`), e a verificação de "sem rolagem
> horizontal" deve checar `document.documentElement.scrollWidth <=
> document.documentElement.clientWidth` (via `browser_evaluate`), não só
> inspeção visual.

- [ ] Landing pública (`/`, deslogada) em 375px: navegar pelas seções
  (header, hero, sobre, amenidades, avisos, footer) e confirmar
  `scrollWidth <= clientWidth` em cada uma; nenhum texto visualmente
  cortado.
  <saída crua aqui>

- [ ] Abrir modal de login em 375px: confirmar que o dialog cabe na tela
  (sem overflow horizontal) e todos os campos/botões são clicáveis.
  <saída crua aqui>

- [ ] Login como moradora/síndica, portal do morador em 375px: percorrer
  as seções (avisos, reservas, financeiro, chamados, classificados,
  visitantes, pautas) e confirmar `scrollWidth <= clientWidth` em cada
  uma.
  <saída crua aqui>

- [ ] Login como síndica, painel admin em 375px: percorrer as listas de
  gestão (amenidades, moradores, avisos, classificados pendentes,
  chamados, visitantes) e confirmar `scrollWidth <= clientWidth`; testar
  que um botão de ação (ex. editar) é clicável sem scroll horizontal.
  <saída crua aqui>

- [ ] Seção de histórico financeiro (ou outra exibição densa/tabular) em
  375px: confirmar que não força rolagem horizontal da página — reflow
  para lista/cards ou `overflow-x-auto` contido ao próprio componente.
  <saída crua aqui>

- [ ] Rodar `npm run build` (ou `bun run build`) e colar a saída completa,
  confirmando build sem erro.
  <saída crua aqui>
