-- Feature 07: a draft Evidence Record composed from the student's artifact,
-- student-provided context, and the separate AI proposal.
create table if not exists public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  record_version integer not null default 1 check (record_version > 0),
  status text not null default 'draft' check (status = 'draft'),
  approval_status text not null default 'not_yet_approved' check (approval_status = 'not_yet_approved'),
  record_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (evidence_id, record_version)
);

create index if not exists evidence_records_owner_created_idx
  on public.evidence_records(owner_id, created_at desc);
create index if not exists evidence_records_evidence_created_idx
  on public.evidence_records(evidence_id, created_at desc);

alter table public.evidence_records enable row level security;

create policy "Applicants can read own Evidence Record drafts"
on public.evidence_records
for select
to authenticated
using (
  owner_id = auth.uid()
  and exists (
    select 1 from public.evidence_items e
    where e.id = evidence_id and e.owner_id = auth.uid()
  )
);

comment on table public.evidence_records is
  'Feature 07 draft Evidence Records. AI content remains explicitly proposed and is not verified or student-approved until a later review step.';

-- Feature 06 writes an AI-analysis audit event; include that event type in the
-- existing audit vocabulary so the Feature 06 workflow can persist its audit entry.
alter table public.transformation_events
  drop constraint if exists transformation_events_event_type_check;

alter table public.transformation_events
  add constraint transformation_events_event_type_check
  check (event_type in ('created', 'extracted', 'ai_analysis_proposed', 'evidence_record_generated', 'corrected', 'verification_changed', 'review_resolved', 'excluded', 'included'));
