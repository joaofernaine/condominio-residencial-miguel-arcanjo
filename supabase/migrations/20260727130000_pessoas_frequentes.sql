-- Pessoas frequentes: atalho para o morador salvar nome+CPF de quem visita
-- com regularidade (ex. mae, pai, irmao) e reaproveitar no cadastro de
-- visitante sem redigitar. Lista privada por morador (sem acesso da
-- sindica), mesmo padrao de RLS de `visitantes` via current_profile().

create table public.pessoas_frequentes (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references public.condominios(id) on delete cascade,
  morador_id uuid not null references public.profiles(id) on delete cascade,
  nome text not null,
  cpf text not null,
  created_at timestamptz not null default now(),
  unique (morador_id, cpf)
);

alter table public.pessoas_frequentes enable row level security;

create policy pessoas_frequentes_select on public.pessoas_frequentes
  for select using (morador_id = (select profile_id from current_profile()));

create policy pessoas_frequentes_insert on public.pessoas_frequentes
  for insert with check (
    condominio_id = (select condominio_id from current_profile())
    and morador_id = (select profile_id from current_profile())
  );

create policy pessoas_frequentes_update on public.pessoas_frequentes
  for update using (morador_id = (select profile_id from current_profile()));

create policy pessoas_frequentes_delete on public.pessoas_frequentes
  for delete using (morador_id = (select profile_id from current_profile()));

comment on table public.pessoas_frequentes is
  'Pessoas que o morador salva para reutilizar nome+CPF no cadastro de visitante. Privado por morador_id, sem acesso da sindica.';
