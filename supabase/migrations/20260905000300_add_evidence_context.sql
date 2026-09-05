create table public.evidence_context (
  evidence_id uuid primary key references public.evidence_items(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  purpose text not null check (char_length(trim(purpose)) between 10 and 1000),
  role text not null check (char_length(trim(role)) between 3 and 500),
  actions text not null check (char_length(trim(actions)) between 10 and 2000),
  outcome text not null check (char_length(trim(outcome)) between 3 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index evidence_context_owner_id_idx on public.evidence_context(owner_id);

create trigger evidence_context_updated_at before update on public.evidence_context
for each row execute function public.set_updated_at();

alter table public.evidence_context enable row level security;

create policy "context: applicant reads own" on public.evidence_context
for select using (owner_id = auth.uid());

create policy "context: applicant creates own" on public.evidence_context
for insert with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.evidence_items e
    where e.id = evidence_id and e.owner_id = auth.uid()
  )
);

create policy "context: applicant updates own" on public.evidence_context
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
