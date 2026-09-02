-- Sem isso, quem deixa a tela de Visitantes/Reservas aberta antes de um
-- pedido novo chegar só vê depois de recarregar a página na mão — foi o
-- que aconteceu com a síndica: um morador cadastrou visitante e "não
-- apareceu" pra ela até alguém dar refresh. Adiciona as duas tabelas na
-- publicação de realtime pra o front poder assinar mudanças ao vivo.
alter publication supabase_realtime add table public.visitantes, public.reservas;
