# Test Plan — ajustes-visuais-e-rate-limit-login

> Regra: só o agente de QA (separado, não edita código) marca os checkboxes.
> Todo check vem com a saída crua colada logo abaixo. Sem saída, sem check.
> Mock não conta como prova — web usa Playwright de verdade; não-web usa
> CLI/request/script real.

> NOTA (implementador, 2026-07-21): todos os itens abaixo já foram
> exercitados via Playwright real no QA durante a implementação (viewport
> 375px para os visuais; fluxo completo de 6 tentativas de login pro
> rate-limit, incluindo checagem direta no banco via SQL). Isso NÃO
> substitui o check independente do QA — só documenta que o caminho feliz
> já foi visto funcionando antes de entregar.

- [ ] Morador, 375px: abas "Obras & Reformas" — as 3 abas cabem numa linha,
  "Planejadas" mostra conteúdo dentro da caixa (não vazando). Mesmo teste
  na visão da síndica ("Andamento das obras").
  <saída crua aqui>

- [ ] Morador: seção "Reserve um espaço" mostra só o botão "Churrasqueira"
  (sem Salão de Festas/Quadra Esportiva). Números do calendário legíveis
  em 375px.
  <saída crua aqui>

- [ ] Morador, 375px: "Minhas reservas" com pelo menos 1 pedido mostra o
  badge "N pedido(s)" numa linha só, sem quebrar.
  <saída crua aqui>

- [ ] Morador e síndica, 375px: botão "Sair" na mesma linha do
  título/nome do condomínio no header.
  <saída crua aqui>

- [ ] Síndica: com pelo menos uma pendência real (ex. reserva pendente),
  clicar no sino de notificações e confirmar que a página rola até a
  seção correspondente.
  <saída crua aqui>

- [ ] Rate-limit de login (QA): errar a senha 5x com uma conta de teste,
  confirmar toast normal em cada uma. Na 6ª tentativa (mesmo com senha
  certa), confirmar toast de bloqueio com tempo de espera e confirmar via
  SQL (`select count(*) from login_attempts where email = '...'`) que
  nenhuma tentativa nova foi gravada (bloqueado antes de chamar
  signInWithPassword). Limpar manualmente (`delete from login_attempts
  where email = '...'`) e confirmar que o login válido volta a funcionar
  e zera o histórico.
  <saída crua aqui>

- [ ] Rodar `npm run build` e colar a saída completa, confirmando build
  sem erro.
  <saída crua aqui>
