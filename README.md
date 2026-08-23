# Evidence Packet Builder

A Week-2 MVP for organizing **invented/demo** economic evidence into a traceable Evidence Packet. It is designed for a Mexican applicant with informal or partially formal economic activity.

## Current scope: Commit 2

The app includes a runnable Next.js/Tailwind shell, fixed fictional demo accounts, Supabase database migrations, seed data, deny-by-default Row Level Security, private demo evidence intake, structured extraction, applicant correction/exclusion workflows, and an assigned human-review queue. Packet generation arrives in a later commit.

## Non-negotiable product limits

- No credit score, creditworthiness ranking, approval probability, loan recommendation, or automated lending decision.
- No explanation or inference about a lender's proprietary algorithm.
- No real personal data. Use invented/demo evidence only.
- No applicant onboarding until the evidence schema is approved and a lender commits to reviewing the 20 pilot cases.
- Applicants control information release and will be able to correct or challenge evidence.
- Association-based evidence is prohibited unless it can be inspected, challenged, and corrected by the applicant. This MVP will reject it entirely.

## Security floor (implemented incrementally)

- Keep credentials only in environment variables; `.env.example` contains names only.
- Do not commit real personal data, secrets, or uploaded source files.
- The schema has Row Level Security enabled on every application table, with no broad anonymous policies.
- Demo authentication offers two fixed Supabase Auth accounts only; there is no registration, sign-up, or onboarding route.
- The database stores only allowed, individual-inspectable evidence categories. It has no association, scoring, or decision fields.
- Files are accepted only as PDF, JPG, PNG, or TXT up to 10 MB, and are uploaded through short-lived signed URLs to a non-public Supabase Storage bucket.
- Intake endpoints apply a per-user request limit; production should replace this MVP's process-local limiter with a shared rate-limit store.
- LLM services must never be allowed to set evidence verification status or make lending decisions.
- The extraction prompt and server workflow limit LLM output to structured fields and confidence. Confidence is not verification, and only a human reviewer can verify evidence.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Supabase setup

1. Create a local Supabase project (`supabase start`) or a separate non-production Supabase project.
2. Apply migrations in filename order, then run [`supabase/seed.sql`](./supabase/seed.sql).
3. Copy `.env.example` to `.env.local` and set the public project URL, anon key, and server-only service-role key. Never expose the service-role key to client code or prefix it with `NEXT_PUBLIC_`.
4. Visit `/login` and select either seeded fictional account. The shared local-only password is documented in `supabase/seed.sql`; do not reuse it outside a disposable demo project.

The demo identities and evidence are fabricated. Do not apply the seed file to a production environment.

## Private demo intake

After signing in, the Evidence page validates the title, allowlisted category, optional document date, file name/type, size, SHA-256 hash, and an explicit demo-only attestation. The server issues a short-lived signed upload URL scoped to one private object, then verifies metadata before saving the fictional evidence record, provenance record, and creation audit event. Association-derived categories are rejected and are never stored as evidence.

## Structured extraction

Use the fictional applicant account to run extraction on a seeded record or a private upload. Each run appends an `evidence_extractions` record and a transformation audit event that includes extraction version, fields, confidence, and uncertainty routing. Any missing or below-0.80 confidence field creates an open human-review item and sets evidence to `pending_review`; this is never verification.

With no `LLM_API_KEY`, the app uses a deterministic mock extractor so the demo remains runnable. When configured, the LLM adapter sends private evidence only for structured extraction and validates the returned JSON before saving it. It is instructed and technically constrained not to verify, score, rank, recommend, predict approval, or make lending decisions.

## Applicant corrections and exclusions

Applicants may correct an extracted material field only after extraction exists, and must state a reason. The system preserves the original extracted value, writes an append-only correction record, creates a new structured-data version, logs the transformation, sets the item to `pending_review`, and opens a human-review item. Applicants cannot set any verification status, including `verified`. Applicants can also exclude irrelevant evidence from future packets with a required reason; exclusion preserves, rather than deletes, its audit history.

## Human review

Sign in as the fictional reviewer and open `/review`. The queue returns only items assigned to that reviewer and exposes the evidence source/provenance, structured extraction with confidence, corrections, and transformation history. A reviewer must supply a resolution note and can resolve only their assigned case as `verified`, `rejected`, or `needs_applicant_clarification`. The API verifies both the authenticated reviewer role and case assignment before it writes the review resolution, evidence status, and reviewer audit event. No LLM, upload process, or other automated workflow can write a verification outcome.
