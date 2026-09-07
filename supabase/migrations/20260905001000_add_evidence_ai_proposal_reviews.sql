create table if not exists public.evidence_ai_proposal_reviews (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.evidence_ai_analyses(id) on delete cascade,
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  proposal_index integer not null check (proposal_index >= 0),
  proposal_id text not null,
  student_id uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected')),
  decided_at timestamptz not null default now(),
  unique (analysis_id, proposal_index),
  unique (proposal_id)
);

create index if not exists evidence_ai_proposal_reviews_student_idx
  on public.evidence_ai_proposal_reviews(student_id, decided_at desc);
create index if not exists evidence_ai_proposal_reviews_evidence_idx
  on public.evidence_ai_proposal_reviews(evidence_id, decided_at desc);

alter table public.evidence_ai_proposal_reviews enable row level security;

create policy "Applicants can read own proposal reviews"
on public.evidence_ai_proposal_reviews
for select
to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1
    from public.evidence_items e
    where e.id = public.evidence_ai_proposal_reviews.evidence_id and e.owner_id = auth.uid()
  )
);

create policy "Applicants can insert own proposal reviews"
on public.evidence_ai_proposal_reviews
for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'applicant'
  )
  and exists (
    select 1
    from public.evidence_ai_analyses a
    join public.evidence_items e on e.id = a.evidence_id
    where a.id = public.evidence_ai_proposal_reviews.analysis_id
      and a.evidence_id = public.evidence_ai_proposal_reviews.evidence_id
      and a.owner_id = auth.uid()
      and e.owner_id = auth.uid()
  )
);

create policy "Applicants can update own proposal reviews"
on public.evidence_ai_proposal_reviews
for update
to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1 from public.evidence_items e
    where e.id = public.evidence_ai_proposal_reviews.evidence_id and e.owner_id = auth.uid()
  )
)
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'applicant'
  )
  and exists (
    select 1
    from public.evidence_ai_analyses a
    join public.evidence_items e on e.id = a.evidence_id
    where a.id = public.evidence_ai_proposal_reviews.analysis_id
      and a.evidence_id = public.evidence_ai_proposal_reviews.evidence_id
      and a.owner_id = auth.uid()
      and e.owner_id = auth.uid()
  )
);

comment on table public.evidence_ai_proposal_reviews is
  'Feature 07 student decisions on Feature 06 AI proposals. Decisions are attributable to the authenticated applicant and never modify the original AI analysis or artifact.';
