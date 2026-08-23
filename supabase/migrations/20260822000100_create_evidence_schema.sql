-- Evidence Packet Builder: demo-only evidence schema.
-- This schema intentionally contains no credit score, ranking, approval probability,
-- recommendation, decision, or association-derived evidence fields.

create type public.app_role as enum ('applicant', 'reviewer');
create type public.case_status as enum ('active', 'closed');
create type public.evidence_category as enum (
  'sales_receipt',
  'bank_deposit_record',
  'invoice',
  'utility_service_receipt',
  'self_reported_activity_note'
);
create type public.source_type as enum ('uploaded_document', 'manual_entry');
create type public.verification_status as enum (
  'unverified', 'pending_review', 'verified', 'rejected', 'corrected'
);
create type public.extraction_status as enum ('not_started', 'complete', 'failed');
create type public.review_state as enum ('open', 'in_review', 'needs_applicant_clarification', 'resolved');
create type public.review_decision as enum ('verified', 'rejected', 'needs_applicant_clarification');
create type public.packet_release_status as enum ('draft', 'authorized', 'revoked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  created_at timestamptz not null default now()
);

-- Cases can only exist once the pilot schema and lender review commitment are recorded.
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id),
  schema_approved_at timestamptz not null,
  lender_pilot_committed_at timestamptz not null,
  status public.case_status not null default 'active',
  created_at timestamptz not null default now(),
  check (lender_pilot_committed_at >= schema_approved_at)
);

create table public.case_reviewer_assignments (
  case_id uuid not null references public.cases(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (case_id, reviewer_id)
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 120),
  category public.evidence_category not null,
  source_type public.source_type not null,
  original_filename text,
  storage_path text,
  file_hash text check (file_hash is null or file_hash ~ '^[a-f0-9]{64}$'),
  document_date date,
  uploaded_at timestamptz not null default now(),
  verification_status public.verification_status not null default 'unverified',
  excluded_by_applicant boolean not null default false,
  current_version integer not null default 1 check (current_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_type = 'uploaded_document' and original_filename is not null and storage_path is not null and file_hash is not null)
    or (source_type = 'manual_entry' and original_filename is null and storage_path is null and file_hash is null)
  ),
  check (document_date is null or document_date <= current_date + 1)
);

create table public.evidence_extractions (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  version integer not null check (version > 0),
  extracted_json jsonb not null default '{}'::jsonb,
  confidence_json jsonb not null default '{}'::jsonb,
  extractor_name text not null check (char_length(trim(extractor_name)) between 1 and 120),
  extractor_model text,
  extraction_status public.extraction_status not null default 'not_started',
  created_at timestamptz not null default now(),
  unique (evidence_id, version)
);

create table public.provenance_records (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null unique references public.evidence_items(id) on delete cascade,
  source_type public.source_type not null,
  source_name text not null check (char_length(trim(source_name)) between 1 and 200),
  original_filename text,
  storage_path text,
  file_hash text check (file_hash is null or file_hash ~ '^[a-f0-9]{64}$'),
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null,
  declared_document_date date,
  created_at timestamptz not null default now()
);

create table public.transformation_events (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'extracted', 'corrected', 'verification_changed', 'review_resolved', 'excluded', 'included')),
  actor_id uuid references public.profiles(id),
  actor_role public.app_role,
  old_value_json jsonb,
  new_value_json jsonb,
  reason text check (reason is null or char_length(trim(reason)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  reason_code text not null check (reason_code in ('low_confidence', 'missing_field', 'conflicting_data', 'applicant_correction', 'missing_provenance', 'failed_validation')),
  details_json jsonb not null default '{}'::jsonb,
  state public.review_state not null default 'open',
  assigned_reviewer_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.review_resolutions (
  id uuid primary key default gen_random_uuid(),
  review_item_id uuid not null unique references public.review_items(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  decision public.review_decision not null,
  resolution_note text not null check (char_length(trim(resolution_note)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.packet_authorizations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id),
  authorized_at timestamptz not null default now(),
  revoked_at timestamptz,
  selected_evidence_ids_json jsonb not null check (jsonb_typeof(selected_evidence_ids_json) = 'array')
);

create table public.evidence_packets (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  applicant_id uuid not null references public.profiles(id),
  authorization_id uuid not null references public.packet_authorizations(id) on delete restrict,
  packet_version integer not null check (packet_version > 0),
  packet_json jsonb not null,
  packet_hash text not null check (packet_hash ~ '^[a-f0-9]{64}$'),
  generated_at timestamptz not null default now(),
  release_status public.packet_release_status not null default 'draft',
  unique (case_id, packet_version)
);

-- Records an attempted blocked category without retaining association-sensitive payload.
create table public.association_firewall_events (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid references public.evidence_items(id) on delete set null,
  owner_id uuid not null references public.profiles(id),
  attempted_category text not null check (char_length(trim(attempted_category)) between 1 and 120),
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index cases_applicant_id_idx on public.cases(applicant_id);
create index evidence_items_case_id_idx on public.evidence_items(case_id);
create index evidence_items_owner_id_idx on public.evidence_items(owner_id);
create index review_items_assigned_reviewer_id_idx on public.review_items(assigned_reviewer_id);
create index transformation_events_evidence_id_created_at_idx on public.transformation_events(evidence_id, created_at);

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_assigned_reviewer(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.case_reviewer_assignments
    where case_id = target_case_id and reviewer_id = auth.uid()
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger evidence_items_updated_at before update on public.evidence_items
for each row execute function public.set_updated_at();

-- Evidence source/provenance fields are immutable after creation. Verification can only
-- move through a later reviewer-controlled workflow, never from an applicant update.
create or replace function public.protect_evidence_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.case_id is distinct from old.case_id
    or new.owner_id is distinct from old.owner_id
    or new.source_type is distinct from old.source_type
    or new.original_filename is distinct from old.original_filename
    or new.storage_path is distinct from old.storage_path
    or new.file_hash is distinct from old.file_hash
    or new.uploaded_at is distinct from old.uploaded_at then
    raise exception 'Evidence provenance fields are immutable';
  end if;
  if auth.uid() = old.owner_id and new.verification_status is distinct from old.verification_status then
    raise exception 'Applicants cannot change verification status';
  end if;
  return new;
end;
$$;

create trigger evidence_items_protect_immutable_fields before update on public.evidence_items
for each row execute function public.protect_evidence_immutable_fields();

-- All application tables use deny-by-default RLS policies.
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_reviewer_assignments enable row level security;
alter table public.evidence_items enable row level security;
alter table public.evidence_extractions enable row level security;
alter table public.provenance_records enable row level security;
alter table public.transformation_events enable row level security;
alter table public.review_items enable row level security;
alter table public.review_resolutions enable row level security;
alter table public.packet_authorizations enable row level security;
alter table public.evidence_packets enable row level security;
alter table public.association_firewall_events enable row level security;

create policy "profiles: users read own profile" on public.profiles for select using (id = auth.uid());
create policy "cases: applicant reads own case" on public.cases for select using (applicant_id = auth.uid());
create policy "cases: assigned reviewer reads case" on public.cases for select using (public.is_assigned_reviewer(id));
create policy "assignments: reviewer reads own assignment" on public.case_reviewer_assignments for select using (reviewer_id = auth.uid());

create policy "evidence: applicant reads own" on public.evidence_items for select using (owner_id = auth.uid());
create policy "evidence: assigned reviewer reads" on public.evidence_items for select using (public.is_assigned_reviewer(case_id));
create policy "evidence: applicant creates own" on public.evidence_items for insert with check (owner_id = auth.uid() and exists (select 1 from public.cases c where c.id = case_id and c.applicant_id = auth.uid() and c.status = 'active'));
create policy "evidence: applicant updates own non-provenance fields" on public.evidence_items for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "extractions: case participants read" on public.evidence_extractions for select using (exists (select 1 from public.evidence_items e where e.id = evidence_id and (e.owner_id = auth.uid() or public.is_assigned_reviewer(e.case_id))));
create policy "provenance: case participants read" on public.provenance_records for select using (exists (select 1 from public.evidence_items e where e.id = evidence_id and (e.owner_id = auth.uid() or public.is_assigned_reviewer(e.case_id))));
create policy "events: case participants read" on public.transformation_events for select using (exists (select 1 from public.evidence_items e where e.id = evidence_id and (e.owner_id = auth.uid() or public.is_assigned_reviewer(e.case_id))));

create policy "review: applicant reads own" on public.review_items for select using (exists (select 1 from public.evidence_items e where e.id = evidence_id and e.owner_id = auth.uid()));
create policy "review: assigned reviewer reads" on public.review_items for select using (assigned_reviewer_id = auth.uid() and public.is_assigned_reviewer(case_id));
create policy "review resolutions: participant reads" on public.review_resolutions for select using (exists (select 1 from public.review_items r join public.evidence_items e on e.id = r.evidence_id where r.id = review_item_id and (e.owner_id = auth.uid() or r.assigned_reviewer_id = auth.uid())));
create policy "review resolutions: assigned reviewer creates" on public.review_resolutions for insert with check (reviewer_id = auth.uid() and exists (select 1 from public.review_items r where r.id = review_item_id and r.assigned_reviewer_id = auth.uid() and public.is_assigned_reviewer(r.case_id)));

create policy "authorizations: applicant reads own" on public.packet_authorizations for select using (applicant_id = auth.uid());
create policy "authorizations: applicant creates own" on public.packet_authorizations for insert with check (applicant_id = auth.uid() and exists (select 1 from public.cases c where c.id = case_id and c.applicant_id = auth.uid()));
create policy "authorizations: applicant revokes own" on public.packet_authorizations for update using (applicant_id = auth.uid()) with check (applicant_id = auth.uid());
create policy "packets: applicant reads own" on public.evidence_packets for select using (applicant_id = auth.uid());
create policy "packets: assigned reviewer reads" on public.evidence_packets for select using (public.is_assigned_reviewer(case_id));
create policy "firewall: applicant reads own" on public.association_firewall_events for select using (owner_id = auth.uid());

-- No direct client insert/update/delete policies exist for provenance, audit events,
-- reviewer assignments, review items, or packets. Later server-side workflows will use
-- narrowly scoped database functions to preserve audit integrity.
