# Week 11 mechanical test log — Agua a Tiempo MX

**Status:** checklist prepared; actual browser tests must be completed before claiming a pass.

## Cases
| ID | Action | Expected result | Actual result |
|---|---|---|---|
| T1 | Submit 420 L and 3 people | Shows 2.0 indicative days using 70 L/person/day | Pending manual run |
| T2 | Submit blank liters | Clear Spanish validation error; no calculation update | Pending manual run |
| T3 | Submit -1 liters | Rejected with Spanish validation error | Pending manual run |
| T4 | Submit 1.5 liters | Rejected because liters must be integer | Pending manual run |
| T5 | Submit 100001 liters | Rejected as out of range | Pending manual run |
| T6 | Submit 0 people | Rejected with Spanish validation error | Pending manual run |
| T7 | Open notices | SIMULACIÓN PARA DEMO is visible; notice remains pending | Pending manual run |
| T8 | Click correction route | Correction process appears without claiming repair authority | Pending manual run |
| T9 | Click preparation checkboxes | Progress count changes from 0 of 5 to 5 of 5 | Pending manual run |
| T10 | Inspect phone width and keyboard focus | Layout remains usable; focus is visible | Pending manual run |

## Mechanical-pass record
- Browser/device:
- Date:
- Bug actually observed:
- Fix commit:
- Redeploy URL:
- Retest evidence:

Do not invent a bug, result, or retest. A real mechanical pass requires at least one observed bug, a fix, and a redeploy.
