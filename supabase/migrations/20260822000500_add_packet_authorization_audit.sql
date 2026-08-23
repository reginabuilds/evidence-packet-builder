-- Packet snapshots are immutable. Authorization/revocation is captured separately so a
-- revoked release cannot change the historical snapshot or erase its audit trail.
create type public.packet_authorization_event_type as enum ('authorized', 'revoked', 'packet_generated', 'downloaded');

create table public.packet_authorization_events (
  id uuid primary key default gen_random_uuid(),
  authorization_id uuid not null references public.packet_authorizations(id) on delete restrict,
  applicant_id uuid not null references public.profiles(id),
  event_type public.packet_authorization_event_type not null,
  packet_id uuid references public.evidence_packets(id) on delete restrict,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index packet_authorization_events_authorization_id_created_at_idx on public.packet_authorization_events(authorization_id, created_at);
alter table public.packet_authorization_events enable row level security;
create policy "packet authorization events: applicant reads own" on public.packet_authorization_events for select using (applicant_id = auth.uid());

drop policy if exists "authorizations: applicant revokes own" on public.packet_authorizations;
drop policy if exists "authorizations: applicant creates own" on public.packet_authorizations;

create or replace function public.prevent_evidence_packet_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Evidence Packet snapshots are immutable';
end;
$$;

create trigger evidence_packets_immutable before update or delete on public.evidence_packets
for each row execute function public.prevent_evidence_packet_mutation();

-- All packet-generation, revocation, and download audit writes occur in authenticated,
-- server-only workflows. There are no client insert/update/delete policies.
