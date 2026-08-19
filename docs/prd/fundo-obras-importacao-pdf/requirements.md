# Requirements — fundo-obras-importacao-pdf

## Contexto
Usuário mandou o PDF real que a administradora ("Escritório Gestão") envia
todo mês — `Relatório dos pagantes - 06.08.2026.pdf`, baixado no
Downloads. É um "Listagem de cobranças c/ Data de Crédito": lista, por
unidade, as cobranças que **já foram pagas**, cada uma com competência
(mês de referência), vencimento, data de crédito, "nosso número" (chave
única do boleto) e o valor total — subdividido em até 3 linhas: **Taxa de
Condomínio**, **Fundo de Reserva** e **Fundo de Obras** (às vezes também
"Recebimento de Multa/juro" ou itens avulsos como "Manut. teto casa
zelador").

No relatório de exemplo (competências 06, 07 e 08/2026): 80 cobranças,
R$89.852,94 no total, sendo **R$47.688,06 só de Fundo de Obras** (53% do
total arrecadado). Isso hoje não aparece em lugar nenhum do portal — o
`historico_financeiro` só guarda um status simples (`pago`/`pendente`/
`atrasado`) por unidade/mês/ano, sem quebrar por tipo de cobrança, e a
síndica marca esse status manualmente na tabela "Unidades & cobranças".

Formato da unidade no relatório: código tipo `101B`, `203B`, `504B`
(número do apto + letra do bloco, sem hífen). O formato hoje salvo em
`profiles.unidade` é livre — a função `criar-morador` grava
`"{bloco}-{apartamento}"` (ex. `"B-1204"`), mas contas mais antigas/
seedadas manualmente têm texto livre (ex. "Bloco B - Apto 1204"). **Os
dois formatos não batem automaticamente com o código do relatório** — não
dá pra confiar em match automático sem revisão.

## Decisões já confirmadas com o usuário
- Importação automática: a síndica sobe o PDF todo mês (upload manual do
  arquivo, sem digitação linha a linha) e o sistema atualiza os status
  sozinho, em vez do fluxo manual atual.
- Moradores veem **só o status** (Em dia/Pendente/Atrasado) — nenhum
  valor em R$ aparece pra eles no histórico mensal (mantém o
  comportamento atual).
- Síndica e moradores veem um **total agregado do Fundo de Obras**
  arrecadado (ex. "Fundo de Obras arrecadado: R$ 47.688,06").
- Esse total **não fica vinculado a nenhuma obra específica** cadastrada
  na seção "Obras" por enquanto — é só um número agregado, solto.

## Decisões de engenharia (assumidas pra poder desenhar — favor
confirmar ou corrigir antes de eu implementar)
- **Sempre existe uma etapa de revisão manual antes de confirmar a
  importação.** O sistema tenta casar automaticamente o código da unidade
  do PDF (`101B`) com um morador cadastrado, mas — dado que os formatos
  não batem hoje — a primeira importação provavelmente vai exigir que a
  síndica associe manualmente cada código à unidade certa numa tela de
  conferência (lista: código do PDF → morador sugerido/selecionável →
  valores). Depois de confirmado uma vez, o sistema **lembra essa
  associação** (novo campo, ex. `profiles.codigo_relatorio_externo`) pra
  próximas importações já virem com o match pronto.
- **O que a importação faz de fato**: pra cada unidade que aparece
  pagando uma competência (mês) no PDF, marca `historico_financeiro`
  daquele mês/ano/unidade como `"pago"`. **Não mexe em quem não aparece**
  — não marca ninguém como atrasado automaticamente (isso continua sendo
  decisão manual da síndica, como hoje). O relatório só lista quem pagou,
  então "não apareceu" não é garantia de atraso (pode ser cobrança ainda
  não vencida, por exemplo).
- **Sem duplicar contagem**: cada cobrança do PDF tem um "nosso número"
  único. O sistema guarda esse número ao importar (nova tabela) e ignora
  linhas já importadas antes — reimportar o mesmo PDF (ou meses
  sobrepostos em relatórios diferentes) não soma o Fundo de Obras em
  dobro.
- **Parsing do PDF**: acontece no navegador (lib de leitura de PDF tipo
  `pdfjs-dist`), não no servidor — mais simples que lidar com parsing de
  PDF numa edge function Deno. Só funciona com PDFs de texto selecionável
  (como o de exemplo) — não com PDF escaneado/imagem.

## Perguntas em aberto
Nenhuma bloqueante — as decisões de engenharia acima ficam sujeitas a
correção do usuário antes/durante a implementação.

## Requisitos

- [ ] Nova tela/seção no painel da síndica: "Importar relatório
  financeiro" — upload de um PDF.
- [ ] Parsing do PDF no navegador extrai, por cobrança: unidade (código
  bruto do relatório), competência (mês/ano), nosso número, e os valores
  de Taxa de Condomínio / Fundo de Reserva / Fundo de Obras / outros.
- [ ] Tela de revisão antes de confirmar: mostra cada código de unidade
  do PDF associado a um morador (auto-sugerido se já houver
  `codigo_relatorio_externo` salvo; combobox pra escolher/corrigir
  manualmente quando não houver match), com aviso visual pra códigos sem
  nenhum morador correspondente. Mostra também um resumo (quantas
  cobranças, quantas já foram importadas antes/serão ignoradas, total de
  Fundo de Obras na leva). **Confirmar não exige 100% das unidades
  casadas** — unidades sem match ficam de fora dessa leva (aviso claro de
  quantas), sem bloquear a importação das que já foram casadas; dá pra
  resolver o resto numa importação seguinte.
- [ ] Ao confirmar: grava associação código→morador (se nova), faz
  upsert de `historico_financeiro` pra `"pago"` nas competências
  cobertas, e registra as cobranças importadas (deduplicando por nosso
  número) numa tabela nova.
- [ ] Reimportar o mesmo PDF (ou um com cobranças já vistas antes) não
  duplica o total nem re-notifica nada — linhas com nosso número já
  visto são puladas silenciosamente (mostradas como "já importado" na
  revisão).
- [ ] Card/stat "Fundo de Obras arrecadado: R$ X" (soma de todas as
  cobranças importadas até hoje) visível tanto no painel da síndica
  quanto no portal do morador — sem quebra por unidade pros moradores.
- [ ] Moradores continuam vendo só o status (Em dia/Pendente/Atrasado)
  no "Meu histórico" — nenhum valor em R$ aparece pra eles ali.
- [ ] Testado com o PDF real fornecido pelo usuário (ou uma cópia
  sintética equivalente no ambiente de QA) — confirma que as 80
  cobranças são lidas corretamente e o total de Fundo de Obras bate com
  R$ 47.688,06.
- [ ] `npm run build` (ou `bun run build`) passa sem erro.

## Fora de escopo
- Vincular o Fundo de Obras arrecadado a uma obra específica da seção
  "Obras" (usuário decidiu deixar solto por enquanto).
- Marcar unidades como "Atrasado" automaticamente com base em data de
  vencimento — fica manual, como hoje.
- Suporte a PDF escaneado/imagem (só texto selecionável).
- Editar/estornar uma importação já confirmada (se a síndica errar,
  corrige na mão pela tela "Unidades & cobranças" que já existe).
