-- Preferência por pessoa de receber (ou não) e-mail de alerta quando
-- entra um visitante/reserva pendente. Quem já pode aprovar (sindica,
-- admin_agencia, ou tem a permissão granular aprovar_visitantes/
-- aprovar_reservas) começa marcado por padrão; a síndica desmarca quem
-- não quiser mais receber.
alter table public.profiles
  add column if not exists receber_alertas_pendencia boolean not null default true;

-- pg_net: chamada HTTP assíncrona do trigger pra edge function que manda
-- o e-mail de verdade (fica em notificar-pendencia).
create extension if not exists pg_net;
