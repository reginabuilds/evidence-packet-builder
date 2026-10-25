# Week 11 decisions and session close

## Decisions
- Chosen vacuum: Household Water Tools.
- User lens: household member managing reserve and occasional deliveries in water-insecure Iztapalapa.
- Sensor: manual input plus explicitly simulated reading; no connected hardware claim.
- ML: explainable deterministic heuristic, labelled demo; not a trained model.
- Third Dragon Stack layer: marketplace-style unit-cost comparison (MXN/litre), not a real seller marketplace.
- Data: no server persistence, no exact household location, no real personal data.
- Incidents: synthetic only, clearly tagged; no cause, restoration time, or quality claim without verification.
- Security: forms validate numeric bounds; no secrets committed; if server-side personal data is added, auth and RLS become blocking requirements.

## Current state
- Packet and implementation prompt committed on branch `week11-agua-a-tiempo` before application code.
- Route shell and static MVP source added.
- Mechanical pass, persona pass, live deployment, two-deploy requirement, and video are **not yet verified/completed**. Do not claim otherwise.

## Tomorrow’s first move
Deploy this branch as a preview, open `/week11` on desktop and mobile, run every mechanical test, document one actual defect and fix it, then perform the fresh-chat Doña Mari screenshot walkthrough. Redeploy after the fix and record the 3:30 demo.
