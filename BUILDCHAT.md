# BUILDCHAT — BUSINESS BENDING WEEK 08

## Session purpose

Build one working Technologist slice for **When the Tools Outrun the Safeguards**: ESCUDO PyME.

## 1. Team synthesis

The team converged on a cybersecurity readiness and incident-response service for Mexican SMEs. The operator view emphasized a human coordinator and an operational response process. The money view reframed the offer as business continuity rather than another technology expense. The adversary view rejected another generic security product and pushed the concept toward what happens after something goes wrong. The Technologist role narrowed the technology contribution to connecting existing controls with a simple workflow.

## 2. Technology decision

The MVP does not attempt to invent a new cybersecurity engine. MFA, backups, monitoring and other controls already exist. The prototype instead demonstrates a workflow layer that explains priorities, keeps recommendation separate from verification, and routes incidents to a named human owner.

**Decision:** use simulated security tooling and simulated AI outputs so the prototype can test workflow and safeguards without making unsupported security claims.

## 3. Exact user and partner

Primary user: owner/administrator of a small Mexican dental clinic without an internal cybersecurity team.

Operational partner: the clinic's IT provider.

Human coordinator: responsible for escalation and irreversible decisions.

## 4. MVP implementation

The home screen introduces ESCUDO PyME and the synthetic dental-clinic context. Mi Escudo presents five prioritized controls. A simulated AI recommendation explains what to do first. Incident mode walks the user through a five-step response. The coordinator screen makes ownership, severity, deadline, IT provider and capacity explicit.

## 5. Safety / shadow clause

AI recommends; a human or deterministic check verifies. AI never pays ransom, contacts an attacker, decides whether affected people should be notified, certifies safety, or performs an irreversible action. No real personal data is used.

## 6. Test evidence

Mechanical checks cover navigation, control status, incident progression, simulation labels and safety boundaries. The persona pass uses Doña Mari, a synthetic small-business owner who reads slowly and distrusts complex apps. The worst confusion is recommendation versus verification; the UI fixes this by making “IA simulada” and human verification explicit.

## 7. Build evidence

The Week 8 implementation plan is recorded in `docs/IMPLEMENTATION_PROMPT_WEEK8.md` and the packet in `docs/PACKET_WEEK8_ESCUDO_PYME.md`. The application is implemented in the Next.js shell with the ESCUDO PyME static interaction under `public/escudo-pyme/`.

## 8. What changed my mind this week

I did not need to build a new cybersecurity engine. The stronger Technologist insight was that the missing layer may be operational: connecting existing controls, explanations and incident steps to the people who must act. The prototype therefore treats AI as a recommendation layer, not an authority.

## 9. Kill condition

If users do not understand the human verification boundary, if the workflow adds confusion, or if it cannot demonstrate meaningful continuity/response benefit for an SME, kill or redesign the concept.

## Note on transcript fidelity

This is a structured development log of the Week 8 implementation decisions. It is not a verbatim export of every chat message. If the instructor explicitly requires a word-for-word transcript, the ChatGPT conversation should be exported separately.
