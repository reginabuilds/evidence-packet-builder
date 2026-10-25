# IMPLEMENTATION PROMPT — BUSINESS BENDING WEEK 11
## Agua a Tiempo MX | Use only the Week 11 Packet + Blueprint

You are the coding agent working in `reginabuilds/evidence-packet-builder`, branch `week11-agua-a-tiempo`. The source of truth is `docs/PACKET_WEEK11_AGUA_A_TIEMPO.md` and the team Blueprint. Do not widen scope or invent production capabilities.

## Exact MVP
Build a Spanish-first, mobile-first household water-preparation dashboard at `/week11`. It must support:
1. Manual reserve reading (litres + date), validated and stored in browser memory/localStorage only if clearly explained. Prefer in-memory state for strict privacy; if localStorage is used, show a “solo en este dispositivo” note and a clear reset action.
2. Water delivery entry (date, litres, total MXN). Validate positive finite values and sensible upper bounds; calculate MXN/litre only when valid.
3. Reserve trend/low-reserve heuristic with a visible label “SIMULACIÓN / regla demostrativa — no es una predicción”. No external AI call and no claim of trained ML.
4. Incident board using synthetic fixtures only, each visibly tagged “DEMO — NO ES AVISO REAL”, with source, status, last update, owner and next update. No invented cause, restoration time, quality statement or live availability.
5. Preparation checklist with non-shaming language; record action locally.
6. Privacy panel: records stay on device; no public household location; no server persistence; clear all data.
7. Optional privacy-safe export/summary preview that omits name, phone, exact address and precise location by default.
8. Small “delivery unit-cost rail” that compares recorded MXN/litre values transparently. This is marketplace logic, not a real seller marketplace.

## Required Dragon Stack floor
- IoT/sensing: manual sensor-style reserve input and a clearly labelled simulated sensor reading toggle/fixture.
- ML: deterministic, explainable heuristic (e.g. falling reserve between two entries / below user-defined threshold). Call it “heurística demostrativa”, not a trained model. Show inputs and why the flag appeared.
- One additional layer: marketplace/unit-cost logic calculating MXN per litre across household-entered delivery records.
- No fabricated hardware connection, real ML model, official feed or market partner.

## Pages / screens
One route with clear sections/cards:
- Header + demo/privacy disclaimer
- “Mi reserva” current estimate, last entry and add-reading form
- “Mis entregas” entry form + unit-cost table
- “Avisos de suministro” demo incident cards and status/source timestamps
- “Qué puedo preparar” checklist
- “Cómo funciona / límites” explanation and clear-data action

## Small testable features and acceptance criteria
F1 — Route shell and demo labels
- `/week11` loads without error at mobile width.
- All fixture data is synthetic and each incident has a visible demo label.
- No secret or API key in client or repo.

F2 — Reserve ledger
- Empty, negative, non-numeric and >100,000 L inputs are rejected with inline Spanish messages.
- Valid reading updates the displayed estimate and date.
- The screen says readings are manual estimates unless the simulated input is explicitly selected.

F3 — Delivery cost logic
- Reject missing, non-positive, non-numeric, >100,000 L, or cost >MX$100,000.
- 500 L and MX$400 calculates MX$0.80/L.
- Invalid/incomplete entries never show a misleading price.

F4 — Simulated sensing + heuristic
- Simulated reading is labelled SIMULATED and never appears as a real measurement.
- Heuristic shows rule and input basis; it never estimates restoration or water quality.
- “Insufficient data” is shown when fewer than two readings exist.

F5 — Incident follow-up
- Every incident includes source, owner, status, last update, next update.
- Unverified notices show “No confirmado” and never display cause/restoration ETA.
- Interface explicitly says only an authorized human can confirm an official event in the real pilot.

F6 — Preparation, privacy and export
- Checklist can be changed and reset.
- Export/summary preview excludes exact address, phone, name and precise coordinates.
- “Borrar mis registros” clears all local records and confirms action.
- No server-side personal data, analytics SDK, public household map or resident fee.

F7 — Test/fix/redeploy
- Run the mechanical checklist, record at least one actual bug found and fixed (do not invent a bug; if no bug is found, create a test that exposes one).
- Run synthetic persona walkthrough as Doña Mari; log confusion and fix the most serious point.
- Redeploy after fixes and record URLs / evidence.

## Architecture
- Next.js existing shell; embed static app from `public/week11/index.html` via `app/week11/page.tsx` iframe, matching existing repository pattern unless there is a compelling reason not to.
- No Supabase needed because no personal server-side data is stored. If any personal data persistence is added, stop and implement Google sign-in plus Supabase RLS before deployment.
- CSS and JS can be self-contained in the HTML for the demo.
- Mermaid packet flow is already provided. Do not replace it with a screenshot.
- The SVG mockup is a design reference only and not the live app.

## Security floor
1. No secrets in repository.
2. No personal server-side storage; do not add unauthenticated persistence.
3. No user-data Supabase tables. If introduced, RLS ON and test ownership isolation.
4. Validate all form inputs and cap lengths/ranges.
5. Use synthetic fixture data only, visibly labelled.
6. No real-world claims from simulated data.

## Commit plan — minimum 5 commits
1. `docs: add Week 11 packet before code` (already present; do not rewrite history).
2. `docs: add Week 11 implementation plan`
3. `feat: add Agua a Tiempo Week 11 route shell`
4. `feat: add reserve and delivery ledger`
5. `feat: add simulated sensing and incident workflow`
6. `test: add mechanical and persona test logs`
7. `fix: improve highest-severity persona confusion`
8. `docs: add demo script and session close`

## Two deploys
- Deploy A after route shell and core ledger are functional.
- Deploy B after mechanical pass + persona fix.
- Never state a deployment is live until the deployment service reports READY and a URL is returned.

## Required documentation
- `docs/IMPLEMENTATION_PROMPT_WEEK11.md` (this plan)
- `docs/TEST_LOG_WEEK11.md` with actual test outcomes, one bug/fix, persona confusion/fix; mark anything not yet run as NOT RUN.
- `docs/DEMO_WEEK11.md`: 3-minute user walkthrough + final 30 seconds “what changed my mind this week”.
- `docs/DECISIONS_WEEK11.md`: decisions, risks, and tomorrow’s first move.
- `docs/BUILDCHAT_WEEK11.md`: factual build transcript notes; do not fabricate a raw chat export.
- `public/week11/agua-a-tiempo-mockup.svg`: static design reference, not a real screenshot.

## Session Close
Before stopping: update DECISIONS_WEEK11.md, write the next first move, commit and push. Report exactly what is complete, what is not run, and what still needs the user’s own recording/upload. Never claim a persona test, mechanical bug, deployment, or video exists without evidence.
