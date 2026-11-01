# Requirements — Seleção de áreas ao cadastrar inquilino

## Contexto
Hoje o inquilino nasce com acesso total e só o dono consegue restringir (card
"Acesso do inquilino"). A síndica pediu poder definir, já no cadastro, o que o
inquilino pode ver/fazer.

## Perguntas em aberto
Nenhuma. Padrão sugerido pela síndica: Votação ❌, Financeiro ❌; Obras,
Reservas, Marketplace, Visitantes e Fale com a síndica ✅.

## Requisitos

- [ ] Em "Cadastrar morador", ao escolher Tipo = Inquilino, aparece a seleção das 7 áreas (checkbox), com Votação e Financeiro desmarcados e as demais marcadas.
- [ ] Ao escolher Dono, a seleção não aparece.
- [ ] Ao cadastrar o inquilino, as áreas desmarcadas ficam gravadas em `unidade_areas_bloqueadas` e o inquilino não acessa essas áreas.
- [ ] O dono continua podendo alterar depois no card "Acesso do inquilino", refletindo o que foi escolhido no cadastro.
- [ ] No diálogo "Editar" da síndica, quando o morador é inquilino, aparecem as 7 áreas com o estado atual; ao salvar, só as alteradas são gravadas. Dono/funcionário não vê a seleção.
- [ ] Se gravar as restrições falhar, a síndica é avisada (o cadastro em si não é desfeito).

## Fora de escopo
Mudanças de schema/RLS/edge function.
