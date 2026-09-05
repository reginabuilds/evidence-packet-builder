create table if not exists public.evidence_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_items(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  analysis_json jsonb not null,
  generator_name text not null,
  generator_model text,
  source_mode text not null check (source_mode in ('ai', 'simulated')),
  created_at timestamptz not null default now()
);

create index if not exists evidence_ai_analyses_owner_created_idx
  on public.evidence_ai_analyses(owner_id, created_at desc);

create index if not exists evidence_ai_analyses_evidence_created_idx
  on public.evidence_ai_analyses(evidence_id, created_at desc);

alter table public.evidence_ai_analyses enable row level security;

create policy "Applicants can read own AI analysis proposals"
on public.evidence_ai_analyses
for select
to authenticated
using (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.evidence_items e
    where e.id = evidence_id
      and e.owner_id = auth.uid()
  )
);

comment on table public.evidence_ai_analyses is
  'Feature 06 AI-generated or simulated proposals. Rows are not verified facts, certifications, scores, rankings, or approved Evidence Records.';
