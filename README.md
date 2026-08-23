# Evidence Packet Builder

A Week-2 MVP for organizing **invented/demo** economic evidence into a traceable Evidence Packet. It is designed for a Mexican applicant with informal or partially formal economic activity.

## Current scope: Commit 2

The app includes a runnable Next.js/Tailwind shell, fixed fictional demo accounts, Supabase database migrations, seed data, and deny-by-default Row Level Security. Evidence upload, extraction, corrections, and packet generation arrive in later commits.

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
- LLM services must never be allowed to set evidence verification status or make lending decisions.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Supabase setup

1. Create a local Supabase project (`supabase start`) or a separate non-production Supabase project.
2. Apply [`supabase/migrations/20260822000100_create_evidence_schema.sql`](./supabase/migrations/20260822000100_create_evidence_schema.sql), then [`supabase/seed.sql`](./supabase/seed.sql).
3. Copy `.env.example` to `.env.local` and set the public project URL and anon key. Never put the service-role key in client code.
4. Visit `/login` and select either seeded fictional account. The shared local-only password is documented in `supabase/seed.sql`; do not reuse it outside a disposable demo project.

The demo identities and evidence are fabricated. Do not apply the seed file to a production environment.
