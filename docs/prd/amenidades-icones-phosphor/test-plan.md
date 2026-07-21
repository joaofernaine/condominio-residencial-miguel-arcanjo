# Test Plan — amenidades-icones-phosphor

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

- [ ] Login como síndica no admin, abrir seção Amenidades, "Nova
  amenidade", abrir o seletor de ícone: confirmar visualmente que a grade
  agora inclui os novos ícones Phosphor (rotulados em português) ao lado
  dos ícones lucide já existentes, sem duplicar rótulo.
  <saída crua aqui>

- [ ] Selecionar um dos novos ícones Phosphor (ex. spa/sauna), preencher
  nome e salvar. Confirmar prévia no dialog antes de salvar, e que o
  ícone aparece corretamente na lista do admin e no card público
  (mesmo componente `AmenidadeIconTile`).
  <saída crua aqui>

- [ ] Editar uma amenidade já cadastrada com ícone lucide (ex. piscina)
  e confirmar que continua funcionando sem alteração — seletor abre com
  o ícone lucide pré-selecionado, sem regressão.
  <saída crua aqui>

- [ ] Editar uma amenidade já cadastrada com emoji livre (ex. a "Spa" 🧖
  criada em [[amenidades-icone-picker]]) e confirmar que continua
  renderizando o emoji normalmente, sem regressão.
  <saída crua aqui>

- [ ] Confirmar que o campo de emoji livre continua disponível no
  seletor mesmo após a adição dos ícones Phosphor (fallback para casos
  não cobertos pela grade).
  <saída crua aqui>

- [ ] Rodar `npm run build` (ou `bun run build`) e colar a saída completa,
  confirmando build sem erro.
  <saída crua aqui>
