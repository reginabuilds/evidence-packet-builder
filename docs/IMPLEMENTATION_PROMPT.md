# Week 07 Implementation Prompt

## Role

You are the coding agent implementing Regina's Week 07 Technologist slice.

## Product decision

Build a decision-support experiment for CDMX concessioned transit that tests whether observed operations contain enough coverage to distinguish normal variability from meaningful representation mismatch.

Do not build a general mapping platform. Do not automate official route changes.

## Required user flow

1. Analyst opens the route-review dashboard.
2. Analyst sees a clear `SIMULATED DATA` label.
3. Analyst chooses one of three deterministic scenarios: mismatch, stable, low coverage.
4. Analyst runs analysis.
5. System displays coverage, mismatch/uncertainty, persistence, and map comparison.
6. System generates an evidence package.
7. Analyst records either keep-current-representation or request-field-validation.
8. UI repeats that the signal is evidence for review, not an official route change.

## Acceptance criteria

### Feature 1 — Route comparison
- Green official path and orange observed path are visually distinct.
- Route is labeled as demo/simulated.

### Feature 2 — Coverage gate
- Coverage is shown as a percentage.
- Low coverage produces `Do not conclude`.
- Low coverage never produces a stability claim.

### Feature 3 — Mismatch signal
- High mismatch can produce `Review recommended`.
- Low mismatch produces `No review signal`.
- The score is deterministic and explainable for the demo.

### Feature 4 — Evidence package
- Shows coverage, persistence, lead time, observed-trip count and explanation.
- Explicitly says it is evidence for review.

### Feature 5 — Human review
- Analyst can keep the current representation or request field validation.
- No automatic publication or sanction is possible.

### Feature 6 — Persona safeguards
- `SIMULATED DATA` is visible.
- `Low coverage means unknown, not stable` is visible.
- `The signal is evidence for review, not an official route change` is visible.

## Test plan

Run Vitest and verify:

- insufficient coverage cannot be treated as stability;
- mismatch scenario crosses the review threshold;
- stable scenario stays below the review threshold.

Then perform a manual mechanical pass and persona pass, fix the highest-value confusion, and redeploy.

## Commit plan

1. Add packet and experiment definition.
2. Add analyst visual mockup.
3. Replace Week 2 home shell with Week 7 MVP.
4. Add automated experiment checks.
5. Add persona/build transcript documentation.
6. Add demo script and README update.

## Definition of done

The live URL demonstrates the complete flow in under three minutes, the repo contains the packet, mockup, tests, persona log, build log and demo script, and the product visibly respects the kill condition.
