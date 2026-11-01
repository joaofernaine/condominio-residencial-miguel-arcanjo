# Test Plan — Seleção de áreas ao cadastrar inquilino

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Usar Supabase de QA, nunca produção.

- [ ] Tipo=Inquilino mostra 7 áreas, só Votação e Financeiro desmarcados
  <saída crua aqui>

- [ ] Tipo=Dono esconde a seleção
  <saída crua aqui>

- [ ] Cadastrar inquilino → `select area from unidade_areas_bloqueadas` retorna votacao e financeiro
  <saída crua aqui>

- [ ] Dono logado vê no card "Acesso do inquilino" Votação/Financeiro desmarcados
  <saída crua aqui>

- [ ] Inquilino logado não vê/acessa Votação e Financeiro; acessa Obras
  <saída crua aqui>

- [ ] Editar inquilino existente: abre com estado atual, alterar uma área e salvar muda `unidade_areas_bloqueadas`; Editar dono não mostra a seleção
  <saída crua aqui>

- [ ] Falha ao gravar restrições mostra aviso
  <saída crua aqui>
