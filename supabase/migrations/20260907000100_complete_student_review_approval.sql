-- Feature 08: finalize the Evidence Record from student decisions.
alter table public.evidence_ai_proposal_reviews
  add column if not exists edited_capability text,
  add column if not exists edited_explanation text;

alter table public.evidence_ai_proposal_reviews
  drop constraint if exists evidence_ai_proposal_reviews_decision_check;

alter table public.evidence_ai_proposal_reviews
  add constraint evidence_ai_proposal_reviews_decision_check
  check (decision in ('accepted', 'rejected', 'removed'));

alter table public.evidence_records
  drop constraint if exists evidence_records_status_check;

alter table public.evidence_records
  add constraint evidence_records_status_check
  check (status in ('draft', 'pending_review', 'approved'));

comment on table public.evidence_records is
  'Feature 08 Evidence Records. Finalized capabilities come only from explicit student review decisions; AI remains proposal-only.';
