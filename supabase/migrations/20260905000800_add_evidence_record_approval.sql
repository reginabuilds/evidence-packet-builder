-- Feature 08: explicit student review and approval of an Evidence Record draft.
alter table public.evidence_records
  drop constraint if exists evidence_records_status_check;
alter table public.evidence_records
  add constraint evidence_records_status_check check (status in ('draft', 'approved'));

alter table public.evidence_records
  drop constraint if exists evidence_records_approval_status_check;
alter table public.evidence_records
  add constraint evidence_records_approval_status_check check (approval_status in ('not_yet_approved', 'approved_by_student'));

alter table public.evidence_records
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

create index if not exists evidence_records_approved_by_idx
  on public.evidence_records(approved_by, approved_at desc);

create policy "Applicants can approve own Evidence Record drafts"
on public.evidence_records
for update
to authenticated
using (
  owner_id = auth.uid()
  and status = 'draft'
  and approval_status = 'not_yet_approved'
  and exists (
    select 1 from public.evidence_items e
    where e.id = evidence_id and e.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and status = 'approved'
  and approval_status = 'approved_by_student'
  and approved_by = auth.uid()
);

comment on column public.evidence_records.approved_by is
  'The student account that explicitly approved this record; never populated automatically.';
