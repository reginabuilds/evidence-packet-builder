-- Feature 08: complete student-controlled review and Evidence Record approval.
-- Reuse the existing proposal review table; keep raw AI analysis immutable.
alter table public.evidence_ai_proposal_reviews
  add column if not exists included_in_record boolean not null default false,
  add column if not exists final_capability text,
  add column if not exists final_explanation text,
  add column if not exists final_supporting_evidence jsonb;

alter table public.evidence_ai_proposal_reviews
  drop constraint if exists evidence_ai_proposal_reviews_decision_check;
alter table public.evidence_ai_proposal_reviews
  add constraint evidence_ai_proposal_reviews_decision_check
  check (decision in ('accepted', 'rejected'));

alter table public.evidence_records
  drop constraint if exists evidence_records_status_check;
alter table public.evidence_records
  add constraint evidence_records_status_check
  check (status in ('draft', 'pending_review', 'approved'));

alter table public.evidence_records
  drop constraint if exists evidence_records_approval_status_check;
alter table public.evidence_records
  add constraint evidence_records_approval_status_check
  check (approval_status in ('not_yet_approved', 'approved_by_student'));
