# Requirements — ajustes-visuais-e-rate-limit-login

## Contexto
Depois de testar o app de verdade em QA (localhost:8081), o usuário achou
8 pequenos defeitos visuais/UX na visão do morador e da síndica, e pediu
duas features de segurança: limitar tentativas de login (proteção contra
força bruta) e um log das tentativas. Planejado via plan mode (plano em
`C:\Users\joaov\.claude\plans\quizzical-snacking-treehouse.md`), com
investigação de código prévia (linhas exatas confirmadas antes de
implementar).

## Perguntas em aberto
Todas resolvidas antes de implementar:
- Sino de notificações da síndica: pula direto pra primeira seção com
  pendência > 0, na ordem da página (não um menu com as 5 categorias).
- Rate-limit de login: robusto, bloqueio no servidor (tabela + edge
  function), não só no navegador.
- Log de tentativas: só no banco, sem tela nova no admin.

## Requisitos

- [ ] Abas "Obras & Reformas" (morador e síndica): as 3 abas
  (Concluídas/Em andamento/Planejadas) cabem numa linha só em 375px, sem
  vazar da caixa (`ObrasTabs`, `src/routes/index.tsx`).
- [ ] `RESERVATION_SPACES` (`src/lib/portal-data.ts`) só lista
  "Churrasqueira" — Salão de Festas e Quadra Esportiva removidos (espaços
  que não existem ainda no condomínio real).
- [ ] Números do calendário de reserva (`ReservationModule`) maiores/mais
  legíveis.
- [ ] Badge "X pedido(s)" em "Minhas reservas" (morador) e "X pedido(s)
  pendente(s)" (síndica) numa linha só, sem quebrar.
- [ ] Botão "Sair" alinhado na mesma linha do título do condomínio, nos
  headers de morador e de síndica.
- [ ] Sino de notificações da síndica (`AdminPendenciasBadge`) é clicável
  e rola até a primeira seção (reservas → classificados → visitantes →
  chamados → mensagens, nessa ordem) que tiver pendência.
- [ ] Rate-limit de login: tabela `login_attempts` + edge function
  `controle-login` (5 falhas em 15min bloqueia por 15min; sucesso limpa o
  histórico do e-mail). Aplicado em QA e produção. Nunca revela se um
  e-mail existe de verdade.
- [ ] Build (`npm run build`) passa sem erro.

## Fora de escopo
- Tela de auditoria/log de tentativas de login para a síndica (decisão do
  usuário: log só no banco).
- Menu com breakdown por categoria no sino de notificações (decisão do
  usuário: pula direto pra primeira pendência).
- Mover `signInWithPassword` para dentro da edge function (eliminaria o
  risco residual de "registrar" ser chamado diretamente com `sucesso:
  false` forjado) — mudança maior, não pedida nesta rodada.
