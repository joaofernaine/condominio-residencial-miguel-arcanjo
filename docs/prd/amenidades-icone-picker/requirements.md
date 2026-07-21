# Requirements — amenidades-icone-picker

## Contexto
No cadastro de amenidades (admin), o campo "Ícone" é uma caixa de texto
livre que só resolve corretamente se o admin digitar exatamente um dos ~19
nomes de ícone lucide cadastrados em `AMENIDADE_ICONS`
(`src/routes/index.tsx:193-219`). O usuário tentou colar um emoji de carne
🥩 para representar "churrasqueira" e, como a string não bate com nenhuma
chave do mapa, o app renderiza o ícone de fallback (`Sparkles`, que
visualmente é uma estrelinha) — tanto na lista do admin quanto no card
público da página inicial (`AmenidadeCard`), já que os dois usam o mesmo
componente `AmenidadeIcon`. O problema não é "admin funciona, público não":
os dois já usam o mesmo renderer, o admin só mascara o bug porque mostra o
texto cru digitado ao lado do ícone pequeno.

## Perguntas em aberto
Perguntado ao usuário: manter o sistema de nomes de ícone lucide (expandindo
a lista) ou trocar pra emoji livre. Resposta: **seletor com prévia** — grade
com os ícones lucide já existentes (rotulados em português) + campo pra
digitar/colar um emoji livre para casos não cobertos (ex. churrasqueira),
com prévia ao vivo do ícone escolhido antes de salvar. Nada ficou em aberto.

## Perguntas em aberto (rodada 2)
Depois da primeira versão (emoji renderizado dentro da mesma caixa quadrada
colorida usada pelos ícones lucide), o usuário reportou que o resultado
visual "parece que só colocou o emoji ali, como se não fosse feito pra
aquele lugar". Ajuste feito sem nova pergunta (é refinamento visual da
mesma decisão já tomada, não uma nova decisão de produto): emoji não entra
mais na caixa quadrada com fundo da marca (`bg-secondary`) — passa a ser
renderizado "solto", maior, sem fundo, como um sticker (padrão comum em
Notion/Slack para ícones de emoji), porque tentar forçar um glifo colorido
dentro de uma caixa monocromática pensada pra traço de ícone lucide é o que
causava a sensação de "encaixado à força".

## Requisitos

- [ ] `AmenidadeIconTile` (`src/routes/index.tsx`, substituiu o antigo
  `AmenidadeIcon`) passa a renderizar
  emoji bruto (qualquer caractere fora do intervalo ASCII salvo em `icone`)
  diretamente como texto — sem a caixa colorida `bg-secondary` usada pelos
  ícones lucide, maior e "solta" — em vez de cair no fallback `Sparkles`,
  quando a string não bate com nenhuma chave de `AMENIDADE_ICONS`.
- [ ] Novo ícone lucide `Flame` adicionado ao mapa `AMENIDADE_ICONS` (chave
  `flame`) e disponível no seletor com o rótulo "Churrasqueira", cobrindo o
  caso de uso relatado sem depender de emoji.
- [ ] O campo "Ícone" do formulário `AmenidadeDialog`
  (`src/routes/index.tsx:3977-4065`) deixa de ser um `<Input>` de texto
  livre sem orientação visual e passa a ser um seletor (Popover) com:
  - grade de botões para os ícones lucide já suportados, com rótulo em
    português (ex. "Segurança", "Piscina", "Academia", "Churrasqueira",
    "Estacionamento", "Salão de festas", "Playground", "Wi-Fi", etc.);
  - um campo de texto separado para digitar/colar um emoji livre, para
    amenidades não cobertas pela grade;
  - prévia ao vivo (mesmo componente `AmenidadeIcon` usado no card público)
    do ícone/emoji atualmente selecionado, visível antes de salvar.
- [ ] Amenidades já cadastradas continuam funcionando sem migração de dados
  (nenhuma alteração de schema; `icone` continua `string | null` em
  `AmenidadeRow`, `src/lib/portal-data.ts:598-605`).
- [ ] Build (`bun run build` ou `npm run build`) passa sem erro depois da
  mudança.

## Fora de escopo
- Corrigir dados já salvos incorretamente no banco (amenidades existentes
  com `icone` inválido continuam mostrando o fallback até serem editadas
  manualmente pelo seletor novo).
- Trocar `useState` por `react-hook-form`/`zod` no formulário (convenção do
  projeto é não introduzir isso em componente de domínio,
  `docs/projeto/convencoes.md`).
- Biblioteca de emoji-picker externa (grade de emoji com busca) — o campo
  de emoji livre é só um input de texto onde se cola/digita o emoji.
