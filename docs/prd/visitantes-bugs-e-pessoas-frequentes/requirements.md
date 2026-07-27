# Requirements — visitantes-bugs-e-pessoas-frequentes

## Contexto

Depois de entregar a lista de pessoas/placas no cadastro de visitante, o
usuário pediu duas coisas: (1) corrigir bugs do projeto — de um levantamento
de 15 achados documentados, escolheu explicitamente o grupo "correções
seguras e pontuais", pedindo atenção especial pra não quebrar nada no mobile;
(2) uma feature nova: poder salvar pessoas que voltam com frequência (mãe,
pai, irmão) pra não redigitar nome+CPF toda vez que cadastra uma visita.

Os outros dois grupos de bugs levantados (RLS duplicada em `classificados` +
rate-limit de login com bypass; schema de 9 tabelas fora de controle de
migration) ficam de fora — são mudanças maiores e mais arriscadas, tocam
segurança/produção de um jeito que merece sua própria rodada.

Ver design completo em
`C:\Users\Computador João\.claude\plans\temos-que-mudar-a-linked-bengio.md`.

## Perguntas em aberto

Nenhuma bloqueante. Só a pergunta sobre qual grupo de bugs corrigir foi
respondida explicitamente pelo usuário; as 3 perguntas de desenho da feature
"pessoas frequentes" foram resolvidas com a opção recomendada (marcado no
plano para o usuário vetar se não for o que imaginou):

- Lista de pessoas salvas é privada por morador (não compartilhada, não
  visível à síndica).
- Escolher uma pessoa salva no formulário é via botão-ícone por bloco de
  pessoa, abrindo um popover com busca.
- Gerenciar (criar/apagar) é direto no fluxo: checkbox "Salvar para próxima
  vez" ao preencher; apagar é feito dentro do próprio popover de busca — sem
  tela de gerenciamento separada.
- Pessoa salva não guarda placa fixa (só nome + CPF).

## Requisitos

### Bug 1 — badge de pendências engole falha de query inteira

- [ ] `src/components/admin-pendencias-badge.tsx:25-29`: trocar
  `.then(fn).catch(fn2)` por `.then(fn, fn2)` (forma de dois argumentos da
  interface `PromiseLike`) nas 5 queries de contagem.
- [ ] `npx tsc --noEmit` não reporta mais os 5 erros
  `Property 'catch' does not exist on type 'PromiseLike<number>'`.
- [ ] Se uma categoria de contagem falhar (ex. RLS bloqueando), só aquela
  categoria degrada para 0 — as outras 4 continuam corretas (antes, uma
  falha zerava o badge inteiro).
- [ ] Nenhuma mudança visual no badge.

### Bug 2 — datas de reserva sem guarda contra valor nulo/malformado

- [ ] Helper local `fmtDataReserva(v: string | null | undefined): string` em
  `src/routes/index.tsx`, retornando `"—"` quando `v` for vazio/nulo ou não
  tiver os 3 segmentos `YYYY-MM-DD`.
- [ ] Substituir os 3 usos diretos de `r.data_inicio.split("-").reverse().join("/")`
  / `b.data_inicio.split("-").reverse().join("/")` (linhas ~1392, 2554, 2629)
  por `fmtDataReserva(...)`.
- [ ] Reservas e bloqueios existentes continuam mostrando a data corretamente
  (regressão) — sem mudança de layout.

### Bug 3 — dialog de visitante pode reabrir com dados do cadastro anterior

- [ ] `src/components/visitantes-novo-dialog.tsx`: o `useEffect` de reset
  passa a disparar na transição para **aberto** (`if (open) {...}`) em vez de
  fechado (`if (!open) {...}`).
- [ ] Fechar o dialog (após sucesso ou cancelamento) e reabri-lo sempre
  mostra o formulário limpo — nunca a tela de sucesso do cadastro anterior
  nem campos com nome/CPF residual.
- [ ] Nenhuma mudança visual/layout.

### Feature — pessoas frequentes

- [ ] Tabela nova `pessoas_frequentes` (`id`, `condominio_id`, `morador_id`,
  `nome`, `cpf`, `created_at`), com FK reais (`ON DELETE CASCADE`) para
  `condominios`/`profiles` e `unique (morador_id, cpf)`.
- [ ] RLS via `current_profile()` (mesmo padrão de `visitantes`): morador só
  enxerga/edita/apaga as próprias linhas; sem acesso de síndica.
- [ ] Migration aplicada primeiro no QA (`fqgmmmxxqzopcwbsdqgk`), testada, só
  depois em produção (`kccgazitxagxcbsuuiwn`).
- [ ] `src/lib/visitantes-data.ts` ganha `PessoaFrequente`,
  `fetchPessoasFrequentes`, `salvarPessoaFrequente` (upsert por
  `morador_id,cpf`), `deletarPessoaFrequente`.
- [ ] Cada bloco de pessoa no dialog de cadastro ganha um botão-ícone
  "Escolher pessoa salva" que abre um popover com busca (`Command`) listando
  as pessoas salvas do morador logado.
- [ ] Selecionar uma pessoa salva preenche nome + CPF do bloco atual.
- [ ] Cada item da lista tem uma ação de apagar (ícone de lixeira) que remove
  a pessoa da lista de salvas sem fechar o popover nem afetar o cadastro em
  andamento.
- [ ] Popover sem nenhuma pessoa salva mostra uma mensagem vazia, sem erro.
- [ ] Cada bloco de pessoa ganha um checkbox "Salvar para próxima vez"
  (default desmarcado). Ao cadastrar o visitante com sucesso, toda pessoa com
  o checkbox marcado é salva (upsert) na lista de pessoas frequentes do
  morador.
- [ ] Falha ao salvar uma pessoa frequente não desfaz nem bloqueia o cadastro
  do visitante (já concluído); mostra um toast de erro à parte.
- [ ] Lista de pessoas salvas é privada: RLS impede um morador ver as pessoas
  salvas de outro morador, mesmo do mesmo condomínio.
- [ ] **Mobile (375×667 e 320×568)**: o popover de busca nunca ultrapassa a
  viewport; os dois botões-ícone do cabeçalho do bloco de pessoa (escolher
  salva + remover pessoa) ficam agrupados sem sobrepor o texto "Pessoa N";
  checkbox + label não quebram de forma estranha; o rodapé fixo
  "Cancelar"/"Cadastrar" do dialog continua visível durante o scroll mesmo
  com 8 pessoas preenchidas.

## Fora de escopo

- RLS duplicada em `classificados` (policies antigas e novas coexistindo).
- Vulnerabilidade do rate-limit de login (bypass para bloquear conta alheia).
- Trazer as 9 tabelas fora de controle de migration para dentro do histórico
  versionado.
- Qualquer outro achado da lista de 15 bugs não citado explicitamente acima
  (ex. `LANDING_CONDOMINIO_ID` hardcoded, índices redundantes, badge sem
  realtime, coluna órfã `pautas.encerra_em`, lint/format quebrado por CRLF,
  ausência de testes automatizados).
- Tela dedicada de gerenciamento de pessoas frequentes fora do fluxo de
  cadastro de visitante.
- Guardar placa fixa associada a uma pessoa salva.
- Editar o nome de uma pessoa salva por qualquer via além de marcar "salvar"
  de novo com o nome corrigido (que sobrescreve via upsert pelo CPF).
