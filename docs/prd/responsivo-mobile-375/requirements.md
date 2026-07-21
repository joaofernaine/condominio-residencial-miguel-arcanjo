# Requirements — responsivo-mobile-375

## Contexto
Pedido do usuário: garantir que o Portal funciona em telas de 375px de
largura (referência: iPhone SE/mini) sem rolagem horizontal, texto
estourado ou cards "sambando" (overflow/quebra de layout). O site já usa
Tailwind com alguns breakpoints (`sm:`/`md:`) na landing pública
(`src/routes/index.tsx`), mas nunca foi auditado especificamente em 375px
nem nas telas autenticadas (portal do morador, admin).

## Perguntas em aberto
Nenhuma — escopo confirmado com o usuário: auditoria + correção em toda a
aplicação (landing pública, portal do morador, admin), não só uma tela
específica.

## Requisitos

- [ ] Landing pública (`/`, deslogada): header/nav, hero, seção "Sobre",
  grade de amenidades, avisos e footer sem rolagem horizontal em 375px de
  largura de viewport; nenhum texto cortado ou vazando do container.
- [ ] Modais/dialogs de autenticação (login, primeiro acesso/troca de
  senha) legíveis e utilizáveis em 375px, sem botões cortados ou campos
  overflow.
- [ ] Portal do morador (dashboard, seções: avisos, reservas, financeiro,
  chamados, classificados, visitantes, pautas/votação) sem rolagem
  horizontal em 375px; cards e listas empilham em coluna única quando
  necessário (`flex-col`/`grid-cols-1`) em vez de forçar largura mínima.
- [ ] Painel admin (listas de gestão — amenidades, moradores, avisos,
  classificados pendentes, chamados, visitantes) sem rolagem horizontal em
  375px; ações (editar/excluir/aprovar) permanecem clicáveis e visíveis,
  mesmo que precisem reempilhar.
- [ ] Qualquer exibição de dados densos/tabulares (ex. histórico
  financeiro) não usa `<table>` de largura fixa sem `overflow-x-auto`
  contido — ou reflow para lista/cards em telas estreitas.
- [ ] Todas as imagens (`<img>`, incluindo hero e fotos de
  classificados/obras) usam `max-width: 100%` efetivo — nenhuma imagem
  força a viewport a esticar.
- [ ] Build (`bun run build` ou `npm run build`) passa sem erro depois da
  mudança.

## Fora de escopo
- Redesign visual além do necessário para caber em 375px (não é troca de
  paleta/tipografia, é ajuste de layout/responsividade).
- Suporte a larguras menores que 375px (ex. dispositivos muito antigos) ou
  a telas muito grandes (>1920px) além do que já existe.
- Modo app/PWA, gestos touch avançados ou performance de rede mobile —
  escopo é só layout/responsividade visual.
