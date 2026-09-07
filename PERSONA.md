# EVIDENCE — Persona Test

## Persona

**Doña Mari, 54**

- Sells food outside the metro.
- Uses WhatsApp.
- Distrusts apps.
- Reads slowly.
- Tends to give up silently when confused.

This is a synthetic persona based on the Week 4 Packet. No real personal data is used.

## Test Goal

Walk through the product screen by screen and identify whether Doña Mari can understand what the product is doing, what she controls, and what will be shared.

The product must remain an evidence organization and contestability layer. It must not become a credit score, ranking, approval probability, lending recommendation, hiring recommendation, or automated decision system.

## Screen-by-Screen Test

### 1. Sign in / Student workspace

**What she should understand:** This is her private workspace for organizing her evidence.

**Potential hesitation:** She may not know why she needs an account or what information is being stored.

**Observed risk:** Authentication and ownership language can feel technical.

**Pass condition:** She understands that the workspace belongs to her and that she controls the evidence workflow.

### 2. Evidence intake

**What she should understand:** She can submit an artifact as evidence.

**Potential hesitation:** File type, technical upload language, or the demo-only nature of the artifact may be confusing.

**Pass condition:** She can identify the upload action and understand that the submitted artifact remains the source evidence.

### 3. Student context

**What she should understand:** She can explain the purpose, her role, what she did, and the outcome.

**Potential hesitation:** Four text fields may feel like paperwork.

**Pass condition:** She can describe the work in plain language and understands that her context is preserved with the artifact.

### 4. AI analysis proposal

**What she should understand:** AI is suggesting possible capabilities from the evidence; it is not proving or certifying them.

**Potential hesitation:** The phrase “AI proposal” could be interpreted as a final judgment.

**Pass condition:** She understands that the proposal requires her review.

### 5. Student review

**What she should understand:** She decides whether each AI proposal belongs in her final record.

**Potential hesitation:** Accept / Reject / Edit can feel like a technical workflow.

**Pass condition:** She can distinguish an AI suggestion from her own decision.

### 6. Evidence Record review and approval

**What she should understand:** The final record contains only capabilities she explicitly accepted and she must approve it herself.

**Potential hesitation:** “Pending student approval” could be misunderstood as an employer or lender approval.

**Pass condition:** She understands that approval is her approval of the Evidence Record, not a lending or hiring decision.

### 7. Sharing control

**What she should understand:** Sharing is off until she activates it. She can revoke access.

**Potential hesitation:** A bearer link may be unfamiliar.

**Pass condition:** She understands that activating sharing creates access for whoever has the link and that revoking it disables access.

### 8. Public shared Evidence Record

**What she should understand:** The recipient sees the approved Evidence Record, not her private workspace or original private account.

**Potential hesitation:** A raw JSON/public record can look technical.

**Pass condition:** She can understand that this is the record she chose to share.

## Main Confusion Identified

The highest-risk confusion is the difference between an **AI proposal** and the **student's own approval**. A slow-reading user who distrusts apps could otherwise interpret an AI-generated capability as a verified fact.

## Fix Applied Before Final Demo

The product was made explicit at the key transition points:

- AI analysis is labeled **SIMULATED AI** when the deterministic demo path is used.
- The analysis says it is a proposal and is not verified fact.
- Feature 07 states that student review is required and that an AI proposal does not count as a student decision.
- Feature 08 says the final record contains only capabilities explicitly accepted by the student.
- The Evidence Record remains **Pending student approval** until the student explicitly approves it.
- The final record preserves the AI-generated proposal for traceability instead of silently converting it into fact.
- Sharing is allowed only after the student has approved the Evidence Record.

## Final Persona Result

**PASS — with the clarification fix above.**

Doña Mari's critical question is answered by the product flow: **“¿Esto lo dijo la aplicación o lo acepté yo?”** The interface and record structure make the distinction explicit before anything can be approved or shared.

## Evidence to Capture for Demo

1. Feature 06 showing the AI proposal and proposal-only disclaimer.
2. Feature 07 showing student decision states.
3. Feature 08 showing the approved/pending approval distinction.
4. Feature 09 showing sharing activation and revocation.
5. Incognito shared-record test showing the approved record without signing in.
