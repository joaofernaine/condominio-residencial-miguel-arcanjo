-- Troca o alerta único (receber_alertas_pendencia) por dois, um por tipo
-- de pendência — pedido do usuário: "notificar por e-mail" vira um
-- checkbox minimalista ao lado de cada permissão (aprovar_visitantes /
-- aprovar_reservas) dentro de "Gerenciar função", em vez de uma seção
-- própria na tela.
alter table public.profiles
  add column if not exists receber_alerta_visitante boolean not null default true,
  add column if not exists receber_alerta_reserva boolean not null default true;

update public.profiles
  set receber_alerta_visitante = receber_alertas_pendencia,
      receber_alerta_reserva = receber_alertas_pendencia
  where receber_alertas_pendencia is not null;

alter table public.profiles drop column if exists receber_alertas_pendencia;
