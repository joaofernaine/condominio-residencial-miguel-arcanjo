# Requirements — Lista de moradores agrupada por bloco (síndica)

## Contexto
Depois do onboarding dos 44 moradores reais, a lista "Unidades & cobranças"
do painel da síndica ficou gigantesca e sempre aparece toda aberta ao entrar
no site, fora de ordem. O usuário pediu (1) ordenação numérica das unidades e
(2) agrupar por bloco (A/B) com abrir/fechar por clique, fechado por padrão,
pra não sobrecarregar a tela.

## Perguntas em aberto
Nenhuma — a descrição do usuário foi suficiente para implementar sem
levantar dúvidas adicionais. Assunções feitas (documentadas aqui em vez de
perguntadas, por serem de baixo risco e reversíveis):
- Ordenação: por bloco (alfabética) e, dentro do bloco, por número do
  apartamento (numérica, não string) — ex.: A-101, A-102, ..., A-110, A-201.
- Estado aberto/fechado não precisa persistir entre reloads (reseta fechado
  a cada entrada na página, que é exatamente o pedido do usuário).
- Aplica-se tanto na lista mobile (cards) quanto na tabela desktop.
- O cabeçalho de cada grupo mostra a letra do bloco e a quantidade de
  unidades (ex.: "Bloco A · 18 unidades").

## Requisitos

- [ ] A lista de moradores (`moradores` no estado do `AdminDashboard`) é
      ordenada por bloco e depois por número do apartamento (numérico).
- [ ] Na seção "Unidades & cobranças", as unidades são agrupadas por bloco.
- [ ] Cada grupo de bloco tem um cabeçalho clicável mostrando a letra do
      bloco e a contagem de unidades daquele bloco.
- [ ] Por padrão, todos os grupos começam fechados (colapsados) ao carregar
      a página.
- [ ] Clicar no cabeçalho de um bloco expande/colapsa a lista de moradores
      daquele bloco, tanto no layout mobile (cards) quanto no desktop
      (tabela).
- [ ] As ações existentes por morador (clique na linha → histórico, botões
      Histórico/Editar/Excluir) continuam funcionando normalmente dentro do
      grupo expandido.
- [ ] Funciona com qualquer conjunto de blocos presentes nos dados (não fixo
      em "A" e "B" — se um dia houver um bloco C, ele aparece também).
- [ ] O diálogo "Editar morador" troca o campo único de texto livre
      "Unidade" por Bloco (dropdown A/B) + Apartamento (input numérico),
      no mesmo padrão visual do diálogo "Cadastrar morador". Ao abrir,
      vem pré-preenchido com o bloco e apartamento atuais do morador.
- [ ] O diálogo "Histórico de pagamentos" (o que abre ao clicar numa linha
      de morador) ganha o mesmo visual do heatmap de pagamentos que o
      morador vê no próprio painel: cada mês vira um bloco com cor sólida
      conforme o status (verde/em dia, vermelho/atrasado, dourado/pendente,
      cinza tracejado/sem registro ou a faturar), com uma linha de resumo
      ("X de Y meses em dia · Z sem registro/atrasados/pendentes") no topo
      e uma legenda de cores embaixo. O mês atual continua destacado com
      selo "Atual". A funcionalidade de trocar o status via dropdown por
      mês continua igual, só o visual muda.

## Fora de escopo
- Persistir estado aberto/fechado entre reloads ou sessões.
- Mudar a ordenação/agrupamento em outras listas do app (ex.: dropdowns de
  seleção de morador em outros formulários).
- Busca/filtro por nome ou unidade (não foi pedido).
