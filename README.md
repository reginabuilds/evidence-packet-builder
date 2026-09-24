# Week 07 — Operational Change Evidence

A Business Bending Week 07 Technologist MVP for **The Holy Driver — When the Road Gets Safer and the Driver Disappears**.

## What this slice tests

CDMX already has official mobility representations. The unresolved experimental question is whether existing observations provide enough coverage to distinguish normal operational variability from a meaningful operational change that deserves human review.

The slice is deliberately not a new mapping platform. It demonstrates:

**observed trips → coverage check → representation mismatch → evidence package → human review**

## Live behavior

- **Mismatch:** high coverage + persistent divergence → review signal.
- **Stable:** high coverage + low divergence → no review signal.
- **Low coverage:** insufficient observations → unknown, not stable.
- Human review is explicit.
- No automatic route updates, sanctions, driver identification, or personal data.
- All telemetry and outcomes in the demo are simulated and labeled.

## Stack

Next.js 15, React 19, Tailwind CSS 4, TypeScript, Vitest, Vercel, GitHub.

The geospatial layer is rendered as an SVG route comparison for the demo. The ML layer is a deterministic, explainable mismatch score so the experiment can be reproduced without claiming an opaque model is production-ready.

## Evidence / packet

- [`docs/PACKET.md`](./docs/PACKET.md) — Week 07 packet, benchmark, architecture, Mermaid flow, test plan and kill condition.
- [`docs/mockup.svg`](./docs/mockup.svg) — analyst screen visual mockup.
- [`PERSONA.md`](./PERSONA.md) — synthetic persona test log.
- [`BUILDCHAT.md`](./BUILDCHAT.md) — structured build transcript and decisions.
- [`DEMO.md`](./DEMO.md) — 3-minute + 30-second demo script.
- [`tests/week7.test.ts`](./tests/week7.test.ts) — experiment checks.

## External evidence used in the packet

The packet distinguishes facts, inferences and unproven hypotheses. External research used for the reasoning includes official CDMX GTFS and concessioned-route datasets, GTFS Schedule/Realtime guidance, and Mobileye REM as the global benchmark.

## Kill condition

> If SEMOVI already has sufficient information and its current workflow performs adequately, kill the data-coverage vacuum. Retain only workflow automation if it demonstrates measurable time or cost savings without reducing decision quality.
