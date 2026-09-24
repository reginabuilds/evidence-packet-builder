# BUILDCHAT — BUSINESS BENDING WEEK 07

## Session purpose

Build one working Technologist slice for **The Holy Driver — When the Road Gets Safer and the Driver Disappears**.

## 1. Initial hypothesis

The starting idea was that drivers hold operational knowledge that technology does not capture.

## 2. Adversarial narrowing

Evidence from existing mapping and mobility systems forced the claim to narrow. Mobileye REM demonstrates that large-scale systems can collect anonymous vehicle observations, aggregate and align drives, model road infrastructure, incorporate aggregate driving behavior, and perform change detection. GTFS already separates scheduled service from realtime changes and provides structures for trip updates, vehicle positions, alerts and route modifications.

**Decision:** kill the broad “driver knowledge is not machine-readable” claim.

## 3. Representation problem

The hypothesis moved to operational-state legibility and then to representation decay: when does the official representation stop explaining observed operation well enough to merit review?

**Decision:** use representation mismatch as the experimental signal, not “bad maps” as a blanket claim.

## 4. Governance challenge

CDMX already publishes official mobility representations. SEMOVI maintains a dataset of routes and stops for concessioned transport, and the CDMX GTFS feed includes routes, trips, frequencies, shapes, stops and stop times.

**Decision:** the MVP must not pretend that no institutional process exists.

## 5. Final experiment hypothesis

The remaining question is whether available observations have sufficient coverage to distinguish normal operational variability from a meaningful operational change. If coverage is sufficient and the current institutional workflow already performs adequately, the data-coverage vacuum is killed.

## 6. Product decision

Build only a decision-support slice:

**observed trips → coverage check → representation mismatch → evidence package → human review**

The system does not automatically publish, update, sanction, or identify drivers.

## 7. Implementation

The old Week-2 evidence shell was replaced at the home route with a Week-7 mobility review dashboard. The dashboard includes:

- simulated geospatial route comparison;
- simulated phone/GPS telemetry label;
- mismatch, stable and insufficient-coverage scenarios;
- coverage confidence;
- deterministic demo mismatch score;
- evidence package;
- human review action;
- explicit kill condition.

## 8. Test-first evidence

A Vitest suite checks that:

1. insufficient coverage cannot be treated as stability;
2. the mismatch demo crosses the review threshold;
3. normal variability remains below the review threshold.

## 9. Persona test

The synthetic Doña Mari persona is used as a comprehension stress test. The highest-risk confusion is whether an observed path means an official route change. The interface explicitly says it is evidence for review only.

## 10. Security / data boundary

The demo uses invented data only. No secrets are added to the repository. No personal data is collected. Simulated telemetry is labeled on screen.

## 11. What changed my mind this week

I started by looking for a technology to capture what drivers know. The evidence repeatedly killed broader versions of that claim. The surviving question is smaller and falsifiable: **does existing observation coverage give an institution enough evidence to know when its representation no longer explains operation, and can a workflow layer improve that decision cheaply enough to matter?**

## 12. Kill condition

> **If SEMOVI already has sufficient information and its current workflow performs adequately, I will kill the data-vacuum hypothesis and retain only a workflow-automation hypothesis if it demonstrates measurable time or cost savings without reducing decision quality.**

## Note on transcript fidelity

This file is a structured development log of the actual decisions and implementation sequence, not a verbatim export of every chat message. The full conversational transcript should be exported from the ChatGPT project if the instructor explicitly requires a word-for-word transcript.
