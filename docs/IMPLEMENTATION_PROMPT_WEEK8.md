# Implementation Prompt — ESCUDO PyME Week 08

Build exactly the MVP described in the Week 8 packet.

## Non-negotiable constraints
- Spanish-first and phone-first.
- Synthetic dental clinic only.
- No real personal data, passwords, private keys or sensitive documents.
- AI outputs are simulated and visibly labeled.
- AI explains/prioritizes but cannot verify, certify, notify, pay, contact attackers, or take irreversible actions.
- Every incident flow exposes a named human coordinator and next owner.
- Do not build an antivirus or password manager.

## Build order
1. Shell and navigation: Home, Mi Escudo, Incidentes, Coordinador.
2. Five prioritized synthetic controls with status and plain-Spanish explanation.
3. Simulated AI recommendation that is clearly non-authoritative.
4. Five-step simulated incident response: confirm/contain, preserve evidence, identify affected data, communication, closure.
5. Coordinator view with synthetic incident ID, owner, IT provider, severity, next action, deadline and capacity.
6. Security-floor audit.
7. Mechanical + persona test, document one issue, fix it, redeploy.

## Acceptance criteria
- Navigation works without reload.
- First action is visually obvious.
- Recommendation and verified/completed states are distinct.
- Incident flow advances and names the human owner.
- No attacker contact, ransom action or automatic notification exists.
- Coordinator capacity is explicit.
- No secrets or real personal data are present.

## Commit plan
- feat: add escudo pyme shell
- feat: add prioritized shield workflow
- feat: add simulated incident response
- feat: add coordinator triage view
- test: fix persona comprehension issue and finalize demo

## Demo path
Home → Mi Escudo → point to MFA as first action → show simulated AI recommendation → Incidentes → advance steps → Coordinador → explain human escalation and capacity.
