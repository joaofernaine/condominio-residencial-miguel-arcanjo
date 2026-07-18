# Requirements — Supabase de QA

## Contexto

O harness (ver `CLAUDE.md`) exige que o agente de QA teste de verdade, sem
mock. Boa parte do domínio (`criar-morador`, chamados, classificados,
visitantes) é escrita — um QA só-leitura não prova nada dessas features. O
projeto atual (`kccgazitxagxcbsuuiwn`, org `JOAO_VFT`) é o único Supabase
existente e tem credenciais reais no `.env`. Decisão da Fase 2: nunca deixar
QA escrever nesse projeto. Esta tarefa monta um Supabase separado só pra QA.

Decisão de custo (perguntada ao usuário): **projeto novo separado, free
tier (US$ 0/mês)**, em vez de branch nativo (cobra US$ 0,01344/hora). Custo
de não ter sincronização automática de schema: schema precisa ser extraído
do projeto atual e aplicado manualmente no novo.

## Requisitos

> Todos verificados pelo QA em `test-plan.md` (8/8, com saída crua colada) em
> 2026-07-18.

- [x] Projeto Supabase novo criado na org `JOAO_VFT` (`ynccxgfqckbylfofhtrg`),
      mesma região do prod (`sa-east-1`), nome identificável como QA (ex.:
      "Condominio Miguel Arcanjo - QA"). → `fqgmmmxxqzopcwbsdqgk`.
- [x] Schema do projeto de produção (tabelas do schema `public`, colunas,
      chaves primárias/estrangeiras, RLS policies, functions/triggers
      relevantes) extraído e aplicado no projeto de QA — sem copiar dados
      reais de moradores. (Achado: schema drift em produção — ver
      `docs/aprendizados/`.)
- [x] Storage bucket(s) usados pelo domínio (ex. `classificados-fotos`)
      recriados no projeto de QA.
- [x] Edge function `criar-morador` implantada no projeto de QA (mesma
      lógica de validação de auth/role/condominio_id do projeto atual).
- [x] Arquivo `.env.qa` (não versionado) na raiz do projeto com
      `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` apontando pro projeto de
      QA.
- [x] `.gitignore` cobre `.env.qa` (confirmar, não duplicar entrada se
      `.env*` já cobrir).
- [x] Verificação: `list_tables` no projeto de QA mostra as mesmas tabelas do
      projeto de produção (comparação por nome, não por conteúdo).
- [x] Verificação: uma escrita de teste simples (ex. insert em uma tabela de
      baixo risco, tipo `contatos_publicos` ou equivalente) funciona no
      projeto de QA sem erro de schema/RLS inesperado.
- [x] Documentado em `docs/projeto/ambiente.md` (seção nova) como usar o
      Supabase de QA: project ref, como trocar `.env` por `.env.qa` pra
      rodar QA localmente, e o lembrete de nunca usar isso pra escrita no
      projeto de produção.

## Fora de escopo

- Migrar dados reais de moradores/produção para o QA (não é necessário —
  QA cria seus próprios dados de teste).
- Automatizar sincronização contínua entre schema de prod e QA (fica manual
  por enquanto; reavaliar se o schema mudar com frequência).
- Configurar CI para rodar contra o Supabase de QA (fora do escopo desta
  tarefa; é sobre montar o ambiente, não sobre pipeline).
