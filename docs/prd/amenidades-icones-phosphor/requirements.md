# Requirements — amenidades-icones-phosphor

## Contexto
Depois de [[amenidades-icone-picker]] (grade de ícones lucide + campo de
emoji livre para casos não cobertos), o usuário sugeriu usar a biblioteca
Phosphor Icons (https://github.com/phosphor-icons/homepage) para ampliar a
grade de ícones do seletor de amenidades, reduzindo os casos em que o
admin precisa recorrer ao emoji livre.

## Perguntas em aberto
Perguntado ao usuário: trocar `lucide-react` por Phosphor em todo o app,
ou só ampliar o seletor de amenidades? Resposta: **só ampliar o seletor de
amenidades** — `lucide-react` continua sendo a base do app (nav, botões,
menus, etc.); Phosphor entra só como fonte adicional de ícones dentro de
`AMENIDADE_ICONS`/`AmenidadeIconTile` (`src/routes/index.tsx`), para
cobrir amenidades comuns que o lucide não tem um ícone direto (e que hoje
cairiam no campo de emoji livre).

Perguntado em seguida: travar com o usuário a lista exata de
amenidades/ícones Phosphor a adicionar? Resposta: **não precisa** — quem
cadastra as amenidades é a síndica, e ela já pode escolher livremente um
emoji para qualquer amenidade não coberta pela grade (recurso existente de
[[amenidades-icone-picker]]). Ou seja, a lista de ícones Phosphor
adicionados é só uma conveniência para reduzir o uso de emoji nos casos
mais comuns — não precisa cobrir 100% dos casos nem ser validada
antecipadamente item a item. O implementador escolhe um conjunto razoável
de ícones Phosphor comuns para condomínio (usando bom senso), sem precisar
de aprovação prévia de cada um.

## Requisitos

- [ ] Biblioteca `@phosphor-icons/react` adicionada como dependência do
  projeto (`package.json`), sem remover ou substituir `lucide-react`.
- [ ] `AMENIDADE_ICONS` (`src/routes/index.tsx`) passa a aceitar ícones de
  ambas as bibliotecas (lucide e Phosphor) através do mesmo mapa/tipo —
  `AmenidadeIconTile` continua funcionando sem mudança de assinatura
  (`icone: string | null`).
- [ ] Conjunto de ícones Phosphor comuns para condomínio adicionado ao
  `AMENIDADE_ICON_PICKER` (ex.: spa/sauna, bicicletário, portaria/guarita,
  quadra poliesportiva, pet place, coworking, lavanderia, elevador — lista
  final a critério do implementador, sem duplicar rótulo/ícone já existente
  do lucide). Não precisa cobrir todos os casos possíveis: o campo de
  emoji livre continua como fallback para o que não estiver na grade.
- [ ] Grade do seletor (Popover em `AmenidadeDialog`) mostra os novos
  ícones Phosphor junto aos ícones lucide já existentes, mantendo
  destaque visual do ícone selecionado ao editar uma amenidade existente.
- [ ] Amenidades já cadastradas com ícone lucide ou emoji continuam
  funcionando sem migração de dados.
- [ ] Build (`bun run build` ou `npm run build`) passa sem erro depois da
  mudança.

## Fora de escopo
- Substituir `lucide-react` por Phosphor em qualquer outro lugar do app
  (nav, botões, menus, outras seções) — decisão explícita do usuário foi
  manter lucide como base.
- Remover o campo de emoji livre do seletor — Phosphor amplia a cobertura,
  mas o emoji livre continua existindo para casos não previstos.
- Migrar amenidades já cadastradas para os novos ícones Phosphor
  automaticamente.
