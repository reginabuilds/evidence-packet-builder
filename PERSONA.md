# PERSONA TEST — WEEK 07

## Synthetic user

**Doña Mari, 54** — sells food outside a metro station, uses WhatsApp but distrusts apps, reads slowly, and gives up silently when confused.

## Why this persona

The primary user for this MVP is an institutional mobility-data analyst, not Doña Mari. The course still requires a synthetic-user test, so this persona is used to stress-test whether the key distinction between **signal** and **official change** is understandable without technical language.

## Test flow

1. Open the dashboard.
2. Identify what the green line and dashed line mean.
3. Select the mismatch scenario.
4. Run analysis.
5. Read the coverage result.
6. Decide whether the system has enough information to make a conclusion.
7. Read the evidence package.
8. Choose a human-review action.

## Confusion log

- “Representation mismatch” is technical language.
- “Coverage” needs a short explanation.
- “Simulated data” must be visible so demo values are not mistaken for live public data.
- “Review recommended” must not be confused with “route officially changed.”

## Worst confusion and fix

The strongest risk is that a user interprets the orange observed path as an official route change. The MVP therefore repeats the boundary in the evidence and review panels:

> **The signal is evidence for review, not an official route change.**

The coverage panel also states:

> **Low coverage means unknown, not stable.**

## Result

- The two path layers are distinguishable from the legend.
- Low coverage is clearly presented as uncertainty rather than stability.
- The analyst owns the final decision.
- The product does not publish or sanction automatically.

## Production follow-up

Replace “representation mismatch” with plainer language such as “Observed operation differs from the official representation” if testing shows the technical phrase slows comprehension.
