-- Demo-only identities. These are fictional accounts for a local Supabase environment.
-- Password for both demo users: DemoOnly-NotForProduction-2026!
-- Do not use this file against a production project.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'lucia.demo@evidence-packet.test',
  crypt('DemoOnly-NotForProduction-2026!', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"display_name":"Lucía Morales (Demo)"}', now(), now()
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated', 'reviewer.demo@evidence-packet.test',
  crypt('DemoOnly-NotForProduction-2026!', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"display_name":"Mariana Cruz (Demo Reviewer)"}', now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) values
  ('31111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"lucia.demo@evidence-packet.test"}', 'email', 'lucia.demo@evidence-packet.test', now(), now(), now()),
  ('32222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"reviewer.demo@evidence-packet.test"}', 'email', 'reviewer.demo@evidence-packet.test', now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, role, display_name) values
  ('11111111-1111-1111-1111-111111111111', 'applicant', 'Lucía Morales (Demo)'),
  ('22222222-2222-2222-2222-222222222222', 'reviewer', 'Mariana Cruz (Demo Reviewer)')
on conflict (id) do nothing;

insert into public.cases (id, applicant_id, schema_approved_at, lender_pilot_committed_at, status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '2026-08-01T12:00:00Z', '2026-08-05T12:00:00Z', 'active')
on conflict (id) do nothing;

insert into public.case_reviewer_assignments (case_id, reviewer_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into public.evidence_items (id, case_id, owner_id, title, category, source_type, document_date, verification_status) values
  ('b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mercado sales log', 'self_reported_activity_note', 'manual_entry', '2026-08-20', 'pending_review'),
  ('b2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mobile-wallet deposit', 'bank_deposit_record', 'manual_entry', '2026-08-18', 'unverified'),
  ('b3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Proveedor invoice', 'invoice', 'manual_entry', '2026-08-12', 'verified')
on conflict (id) do nothing;

insert into public.provenance_records (evidence_id, source_type, source_name, uploaded_by, uploaded_at, declared_document_date) values
  ('b1111111-1111-1111-1111-111111111111', 'manual_entry', 'Demo applicant activity entry', '11111111-1111-1111-1111-111111111111', '2026-08-20T14:00:00Z', '2026-08-20'),
  ('b2222222-2222-2222-2222-222222222222', 'manual_entry', 'Demo mobile-wallet record', '11111111-1111-1111-1111-111111111111', '2026-08-18T14:00:00Z', '2026-08-18'),
  ('b3333333-3333-3333-3333-333333333333', 'manual_entry', 'Demo supplier invoice entry', '11111111-1111-1111-1111-111111111111', '2026-08-12T14:00:00Z', '2026-08-12')
on conflict (evidence_id) do nothing;

insert into public.transformation_events (evidence_id, event_type, actor_id, actor_role, new_value_json, reason, created_at) values
  ('b1111111-1111-1111-1111-111111111111', 'created', '11111111-1111-1111-1111-111111111111', 'applicant', '{"demo":true}', 'Created fictional demo evidence.', '2026-08-20T14:00:00Z'),
  ('b2222222-2222-2222-2222-222222222222', 'created', '11111111-1111-1111-1111-111111111111', 'applicant', '{"demo":true}', 'Created fictional demo evidence.', '2026-08-18T14:00:00Z'),
  ('b3333333-3333-3333-3333-333333333333', 'created', '11111111-1111-1111-1111-111111111111', 'applicant', '{"demo":true}', 'Created fictional demo evidence.', '2026-08-12T14:00:00Z')
on conflict do nothing;

insert into public.review_items (id, evidence_id, case_id, reason_code, details_json, assigned_reviewer_id, state) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'low_confidence', '{"demo":true,"field":"activity_date"}', '22222222-2222-2222-2222-222222222222', 'open'),
  ('c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'missing_field', '{"demo":true,"field":"currency"}', '22222222-2222-2222-2222-222222222222', 'resolved')
on conflict (id) do nothing;

update public.review_items
set resolved_at = '2026-08-13T16:00:00Z'
where id = 'c3333333-3333-3333-3333-333333333333' and resolved_at is null;

insert into public.review_resolutions (review_item_id, reviewer_id, decision, resolution_note, created_at) values
  ('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'verified', 'Fictional demo reviewer confirmed the stated invoice details.', '2026-08-13T16:00:00Z')
on conflict (review_item_id) do nothing;

insert into public.transformation_events (evidence_id, event_type, actor_id, actor_role, old_value_json, new_value_json, reason, created_at) values
  ('b3333333-3333-3333-3333-333333333333', 'review_resolved', '22222222-2222-2222-2222-222222222222', 'reviewer', '{"verification_status":"pending_review"}', '{"verification_status":"verified"}', 'Fictional demo human reviewer resolved the record.', '2026-08-13T16:00:00Z')
on conflict do nothing;
