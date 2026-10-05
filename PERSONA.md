# PERSONA TEST — WEEK 08 · ESCUDO PyME

## Synthetic user

**Doña Mari, 54** — owns a small dental clinic, uses WhatsApp regularly, distrusts complicated apps, reads slowly, and gives up silently when confused.

## Why this persona

The primary user is a small Mexican SME owner/administrator. Doña Mari represents the synthetic median user for the test: she should not need cybersecurity vocabulary to understand the first action or the human escalation path.

## Test flow

1. Open ESCUDO PyME.
2. Identify what the first security action is.
3. Open Mi Escudo.
4. Read the simulated AI recommendation.
5. Distinguish recommendation from verified/completed status.
6. Open Incidentes.
7. Advance through the simulated response steps.
8. Identify the next owner and human coordinator.
9. Open Coordinador and understand severity/capacity.

## Confusion log

- “MFA” may require a short plain-Spanish explanation.
- The phrase “IA simulada” must be visible so the recommendation is not mistaken for a live security engine.
- “Verificado” must not look identical to “recomendado”.
- The incident flow must make the next human owner obvious.
- The user must understand that ESCUDO does not contact attackers, pay ransom or decide irreversible actions automatically.

## Worst confusion and fix

The strongest risk is that a user interprets the AI recommendation as proof that the clinic is safe. The interface therefore repeats the boundary:

> **La IA recomienda; una persona verifica.**

The incident screen also makes the next owner explicit:

> **Proveedor TI + coordinador humano**

## Result

- The first action is visually obvious.
- Recommendation and verification are separated.
- The incident flow identifies a human owner.
- Coordinator capacity is explicit.
- Synthetic-data and simulation labels are visible.

## Production follow-up

If real users still confuse recommendation with verification, replace technical security terms with even plainer Spanish and keep the human-verification state visually dominant.
