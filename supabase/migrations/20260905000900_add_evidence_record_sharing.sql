-- Feature 09: student-controlled sharing for an approved Evidence Record only.
create table if not exists public.evidence_record_shares (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.evidence_records(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  share_token text not null unique,
  share_token_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists evidence_record_shares_active_record_idx
  on public.evidence_record_shares(evidence_record_id)
  where revoked_at is null;
create index if not exists evidence_record_shares_owner_idx
  on public.evidence_record_shares(owner_id, created_at desc);
create index if not exists evidence_record_shares_token_hash_idx
  on public.evidence_record_shares(share_token_hash);

alter table public.evidence_record_shares enable row level security;

create policy "Applicants can read own Evidence Record shares"
on public.evidence_record_shares
for select
to authenticated
using (owner_id = auth.uid());

create policy "Applicants can create own Evidence Record shares"
on public.evidence_record_shares
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.evidence_records r
    where r.id = evidence_record_id
      and r.owner_id = auth.uid()
      and r.status = 'approved'
      and r.approval_status = 'approved_by_student'
  )
);

create policy "Applicants can revoke own Evidence Record shares"
on public.evidence_record_shares
for update
to authenticated
using (owner_id = auth.uid() and revoked_at is null)
with check (owner_id = auth.uid() and revoked_at is not null);

alter table public.transformation_events
  drop constraint if exists transformation_events_event_type_check;

alter table public.transformation_events
  add constraint transformation_events_event_type_check
  check (event_type in ('created', 'extracted', 'ai_analysis_proposed', 'evidence_record_generated', 'sharing_enabled', 'sharing_revoked', 'corrected', 'verification_changed', 'review_resolved', 'excluded', 'included'));

comment on table public.evidence_record_shares is
  'Feature 09 bearer links. Public access is resolved server-side and only while revoked_at is null; only approved student-owned records may be shared.';
comment on column public.evidence_record_shares.share_token is
  'Bearer credential. Returned only to the owning student through authenticated server endpoints and never included in the public shared record.';
