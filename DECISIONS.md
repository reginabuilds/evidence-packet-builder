# DECISIONS.md

## Week 11 — Agua a Tiempo MX
- Selected slice: household reserve ledger + incident source/owner/update workflow + preparation checklist.
- Keep all demo data fictional and visibly labeled.
- Use browser-session-only state; no server-side personal data or auth-dependent data.
- IoT floor: manual phone entry plus explicitly simulated sensor feed.
- ML floor: simulated label only; reserve calculation remains deterministic and explainable.
- Third stack: schematic geodata plus incident workflow logic; no household map.
- Shadow clause: basic notices cannot require a fee or mandatory app; SMS/offline route is a service requirement, not an implemented sender.
- No repair dispatch, public-network repair coverage, water-quality claim, cause prediction, or restoration-time promise.
- Keep Week 7 and Week 8 artifacts intact; Week 11 packet is stored at docs/PACKET_WEEK11_AGUA_A_TIEMPO.md.

## Session close
- Current implementation commit: update this line after each working session.
- Next first move: run T1–T10 on desktop and phone; capture screenshots; fix the first real issue; redeploy.
- Do not mark persona testing complete until screenshots have been walked through in a fresh chat and the confusion log is filled with observed results.
