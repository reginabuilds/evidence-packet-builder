# Week 08 — ESCUDO PyME

A Business Bending Week 08 Technologist MVP for **When the Tools Outrun the Safeguards**.

## What this slice tests

Mexican SMEs already have many cybersecurity controls. The unresolved problem is operational: can a small business without an internal security team turn existing controls into prioritized actions and follow a clear human response path when an incident occurs?

The slice is deliberately not an antivirus or password manager. It demonstrates:

**prioritized controls → simulated AI explanation → human verification → incident mode → coordinator escalation**

## Live behavior

- Spanish-first, phone-first demo.
- Five synthetic security controls with priority and status.
- Simulated AI recommendation, clearly labeled and non-authoritative.
- Simulated incident-response flow with named next owner.
- Coordinator view with severity, deadline, IT provider and capacity.
- No attacker contact, ransom payment, automatic notification decision, safety certification, or irreversible AI action.
- All demo data is synthetic and labeled.

## Stack

Next.js 15, React 19, Tailwind CSS 4, TypeScript, Vercel, GitHub.

The ESCUDO PyME interaction is implemented as a static HTML/CSS/JS demo embedded in the Next.js shell. The AI and security outputs are simulated so the prototype demonstrates workflow and safeguards without pretending to have production security intelligence.

## Evidence / packet

- [`docs/PACKET_WEEK8_ESCUDO_PYME.md`](./docs/PACKET_WEEK8_ESCUDO_PYME.md) — Week 8 packet, benchmark, Mermaid flow, swimlane, architecture, test plan and kill conditions.
- [`docs/IMPLEMENTATION_PROMPT_WEEK8.md`](./docs/IMPLEMENTATION_PROMPT_WEEK8.md) — coding-agent build plan and acceptance criteria.
- [`PERSONA.md`](./PERSONA.md) — synthetic persona test log.
- [`BUILDCHAT.md`](./BUILDCHAT.md) — structured Week 8 development log.
- [`DEMO.md`](./DEMO.md) — 3-minute + 30-second demo script.

## Security floor

No secrets are committed. No real personal data is used. No persistent personal data is stored. AI is explicitly labeled as simulated and recommendations cannot perform irreversible actions.
