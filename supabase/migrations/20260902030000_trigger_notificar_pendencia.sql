-- Dispara a edge function notificar-pendencia (via pg_net, assíncrono —
-- não trava o insert se o e-mail demorar ou falhar) toda vez que um
-- visitante ou reserva entra com status='pendente'.
--
-- O segredo abaixo (x-internal-secret) só prova pra edge function que a
-- chamada veio do nosso próprio trigger, não de qualquer um que descubra
-- a URL — precisa bater com INTERNAL_WEBHOOK_SECRET configurado na
-- function (ver supabase/functions/notificar-pendencia). Não é a
-- service_role key nem dá acesso a nada sozinho.
--
-- IMPORTANTE: a URL abaixo é a de PRODUÇÃO (kccgazitxagxcbsuuiwn). Ao
-- aplicar em QA, troca pela URL do projeto QA (fqgmmmxxqzopcwbsdqgk) —
-- mesmo padrão dos outros arquivos desta pasta, que documentam o que foi
-- aplicado via MCP em cada ambiente.

create or replace function public.notificar_pendencia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tipo text;
begin
  tipo := case tg_table_name when 'visitantes' then 'visitante' else 'reserva' end;
  perform net.http_post(
    url := 'https://kccgazitxagxcbsuuiwn.supabase.co/functions/v1/notificar-pendencia',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', '00e4ae34740c7a38ccc875e9994dadde4e1149f5b5715181306058f324370a75'
    ),
    body := jsonb_build_object(
      'tipo', tipo,
      'registro_id', new.id,
      'condominio_id', new.condominio_id
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_visitante_pendente on public.visitantes;
create trigger trg_notificar_visitante_pendente
after insert on public.visitantes
for each row when (new.status = 'pendente')
execute function public.notificar_pendencia();

drop trigger if exists trg_notificar_reserva_pendente on public.reservas;
create trigger trg_notificar_reserva_pendente
after insert on public.reservas
for each row when (new.status = 'pendente')
execute function public.notificar_pendencia();

-- SECURITY DEFINER + schema public expõe a function via
-- /rest/v1/rpc/notificar_pendencia por padrão (advisor
-- anon_security_definer_function_executable). Chamar direto fora de um
-- trigger sempre falha (TG_TABLE_NAME/NEW só existem em contexto de
-- trigger), mas tira o alerta e fecha a superfície mesmo assim.
revoke execute on function public.notificar_pendencia() from anon, authenticated;
