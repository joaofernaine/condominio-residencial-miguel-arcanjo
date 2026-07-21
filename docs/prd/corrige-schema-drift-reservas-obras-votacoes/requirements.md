# Requirements — corrige-schema-drift-reservas-obras-votacoes

## Contexto
Durante a auditoria de [[responsivo-mobile-375]], ao seedar uma reserva de
teste real no Supabase de QA, a seção "Gerenciamento de Reservas" (admin)
quebrou a página inteira: `TypeError: Cannot read properties of undefined
(reading 'split')`. Investigando, a tabela `reservas` tem a coluna
`data_reserva`, mas `src/lib/portal-data.ts` sempre leu/escreveu
`data_inicio` (que não existe) — e nem `data_fim` nem `observacoes`
existem na tabela, apesar do código (`ReservaRow`, formulário de reserva
com campo "Observações") assumir que existem.

Investigando mais, o mesmo padrão de schema drift (já documentado em
`docs/aprendizados/2026-07-18-harness-setup-e-supabase-qa.md` como
schema fora de migration) afeta mais três pontos, todos confirmados via
`list_tables`/grep no código (o Supabase de QA foi clonado por introspecção
de produção, então o drift existe em produção também):

- `obras`: coluna real é `estado`, código sempre usa `status`; não existe
  coluna `descricao` (código monta formulário com campo de descrição que
  nunca é salvo). Efeito observado: toda leitura de obras falha com 400
  ("Erro ao carregar obras.", visto em toda sessão de teste).
- `pautas`: não tem `data_inicio`/`data_fim` (só `encerra_em`, nunca lido
  pelo código); `criarPauta` tenta inserir essas colunas inexistentes.
- `votos`: colunas reais são `opcao`/`votado_em`, código sempre usa
  `voto`/`created_at`. Efeito observado: ao existir uma pauta, a seção
  "Resultados em tempo real" (admin) quebra o carregamento de votos.

Perguntado ao usuário: ajustar o código para o schema atual (mais rápido,
sem risco de migration, mas perde os campos "descrição da obra",
"observações da reserva" e o formulário atual de "Nova pauta" com
data início/fim) ou migrar o banco para adicionar as colunas que o código
já espera (mantém as funcionalidades como já desenhadas na UI)? Resposta:
**migration** — adicionar as colunas faltantes / renomear as divergentes,
primeiro no Supabase de QA (`fqgmmmxxqzopcwbsdqgk`), validar, depois
aplicar em produção (`kccgazitxagxcbsuuiwn` — projeto ainda pré-lançamento,
sem usuários reais).

**Correção de rota, feita durante a implementação:** antes de aplicar
qualquer coisa em produção, chequei o schema real de
`kccgazitxagxcbsuuiwn` diretamente — e produção **já tinha as colunas
certas** (`obras.descricao`/`status`, `pautas.data_inicio`/`data_fim`,
`reservas.data_inicio`/`data_fim`/`observacoes`, `votos.voto`/`created_at`),
com dados reais nas tabelas (5 reservas, 1 obra, 1 pauta, 2 votos). O
drift só existia no clone de QA, que ficou desatualizado depois que
produção evoluiu (a introspecção documentada em
`docs/aprendizados/2026-07-18-harness-setup-e-supabase-qa.md` capturou um
estado anterior). **A migration de rename/add só foi aplicada no QA**
(para alinhar o clone à produção/código) — produção não foi tocada no
schema, só recebeu um backfill de dados pontual (ver abaixo). O arquivo
de migration não entrou em `supabase/migrations/` porque não é uma
migration válida para produção (tentaria renomear colunas que lá não
existem) — ficou só como comando aplicado via MCP no projeto de QA.

## Requisitos

- [ ] Migration aplicada no Supabase de QA:
  - `reservas`: renomeia `data_reserva` → `data_inicio`; adiciona
    `data_fim date` (backfill = `data_inicio` para linhas existentes);
    adiciona `observacoes text` (nullable).
  - `obras`: renomeia `estado` → `status`; adiciona `descricao text`
    (nullable).
  - `pautas`: adiciona `data_inicio date` e `data_fim date` (nullable;
    `encerra_em` permanece intocada, não usada pelo código).
  - `votos`: renomeia `opcao` → `voto`; renomeia `votado_em` → `created_at`.
  - Confirmado que nenhuma RLS policy ou constraint referencia essas
    colunas por nome de um jeito que quebraria com o rename (checado via
    `pg_policies` antes de aplicar — nenhuma policy usa `estado`, `opcao`,
    `votado_em` ou `data_reserva` nas cláusulas `qual`/`with_check`).
- [ ] Após a migration (aplicada só no QA), os 3 bugs confirmam
  corrigidos no ambiente de QA, testado via Playwright de ponta a ponta:
  - Criar/ver uma reserva real (admin e morador) não quebra a página nem
    gera erro; campo "Observações" é salvo e exibido. ✅ confirmado.
  - "Andamento das obras" carrega sem erro; criar/editar uma obra salva a
    descrição digitada. ✅ confirmado.
  - Criar uma pauta funciona (sem erro de coluna); "Resultados em tempo
    real" carrega os votos sem quebrar quando existe pauta com votos.
    ✅ confirmado.
- [ ] Bug adicional encontrado durante a validação (não é schema drift):
  `registrarVoto` (`src/lib/portal-data.ts`) nunca enviava
  `condominio_id` no insert de `votos` — coluna nullable em produção
  (por isso nunca deu erro lá), mas os 2 votos reais existentes em
  produção ficaram com `condominio_id = NULL`. Corrigido no código
  (passa `profile.condominio_id`) e feito backfill pontual em produção
  (`UPDATE votos SET condominio_id = '...' WHERE condominio_id IS NULL`,
  só nesses 2 registros, confirmado com o usuário antes de rodar).
- [ ] Build (`bun run build` ou `npm run build`) passa sem erro.
- [ ] ~~Mesma migration aplicada em produção~~ — **não aplicável**:
  produção já tinha o schema correto (ver nota acima). Nada a migrar lá;
  item considerado resolvido por não ser necessário.

## Fora de escopo
- Corrigir dados já salvos incorretamente por essas funcionalidades
  quebradas (não há dados reais de produção afetados, já que essas
  funcionalidades nunca funcionaram de fato).
- Limpar a coluna `encerra_em` (órfã/não usada) de `pautas` — decisão de
  produto separada, não bloqueia o fix.
- Qualquer outro schema drift não relacionado a estes 4 pontos (RLS de
  `profiles`/`classificados` etc., já documentado separadamente em
  `docs/aprendizados/`).
