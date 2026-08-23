# Evidence Packet Builder

A Week-2 MVP for organizing **invented/demo** economic evidence into a traceable Evidence Packet. It is designed for a Mexican applicant with informal or partially formal economic activity.

## Commit 1 scope

This initial shell provides a runnable Next.js/Tailwind interface, demo-only workspace, sample fictional evidence, and prominent product guardrails. Evidence upload, extraction, provenance storage, corrections, human review, authentication, and packet generation arrive in later commits.

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
- Future evidence storage will be private, authenticated, validated server-side, and protected by Supabase RLS.
- LLM services must never be allowed to set evidence verification status or make lending decisions.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
