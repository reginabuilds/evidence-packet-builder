-- Applicant corrections are append-only. Direct evidence updates are removed so all
-- material changes must pass through authenticated server workflows and audit history.
create table public.evidence_corrections (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  extraction_version integer not null check (extraction_version > 0),
  field_name text not null check (field_name in ('evidenceType', 'issuerOrSourceName', 'documentDate', 'activityDate', 'amount', 'currency', 'statedActivity')),
  original_value_json jsonb,
  corrected_value_json jsonb,
  correction_reason text not null check (char_length(trim(correction_reason)) between 1 and 2000),
  corrected_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index evidence_corrections_evidence_id_created_at_idx on public.evidence_corrections(evidence_id, created_at);

alter table public.evidence_corrections enable row level security;
create policy "corrections: applicant reads own" on public.evidence_corrections for select using (
  exists (select 1 from public.evidence_items e where e.id = evidence_id and e.owner_id = auth.uid())
);
create policy "corrections: assigned reviewer reads" on public.evidence_corrections for select using (
  exists (select 1 from public.evidence_items e where e.id = evidence_id and public.is_assigned_reviewer(e.case_id))
);

drop policy if exists "evidence: applicant updates own non-provenance fields" on public.evidence_items;

-- No client write policy is granted. The correction API uses an authenticated,
-- server-only service client after confirming the evidence owner.
