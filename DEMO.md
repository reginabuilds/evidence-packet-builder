# EVIDENCE — Week 4 Demo

## Product
EVIDENCE: one student → one real artifact → one structured Evidence Record → one employer-readable share page.

## Demo account
Use the fictional Supabase demo applicant account. All evidence shown in this demo is invented sample data.

## 3-minute demo flow

### 1. Sign in and upload evidence
- Sign in as the fictional student/applicant.
- Upload `demo_market_sales_receipt.txt`.
- Confirm the app saves it as unverified demo evidence.
- Point out that the artifact is private and remains the source evidence.

### 2. Add student context
Enter the student's purpose, role, actions, and outcome for the artifact.

Demo context:
- Purpose: The purpose was to record a small fictional market sales activity and preserve the work as evidence.
- Role: I was responsible for recording the sales activity and organizing the evidence.
- Actions: I recorded the sample sales, organized the information, and attached the fictional receipt as supporting evidence.
- Outcome: The sales activity was documented in a structured evidence record that can be reviewed later.

### 3. Run AI analysis
- Run the AI analysis proposal.
- Show the `SIMULATED AI` label.
- Explain that the AI proposes evidence-backed capabilities from the artifact and student context.
- Emphasize that the proposal is not verified fact and does not score, rank, certify, guarantee capability, or make a hiring decision.

### 4. Student review
- Open Feature 07 · Student review.
- Review each AI proposal.
- Accept only capabilities the student wants represented.
- Reject or remove proposals that should not appear in the final record.
- If needed, edit a capability/explanation before accepting it.
- Point out that AI cannot approve its own proposal.

### 5. Generate the Evidence Record
- Open Feature 08 · Review & approval.
- Select `Generate from student review`.
- Show that the record contains only capabilities explicitly accepted by the student.
- Show the status `Pending student approval`.
- Review the student-provided information, artifact, finalized capabilities, evidence references, and boundaries.

### 6. Student approval
- Explicitly approve the Evidence Record as the student.
- Show that the record changes to `approved` / `approved by student`.
- Explain that approval is a student action, not an AI decision.

### 7. Sharing control
- Open Feature 09 · Sharing control.
- Activate sharing.
- Copy the generated share link.
- Open the link in an incognito window without signing in.
- Show that the approved Evidence Record is readable through the share page.

### 8. Revoke sharing
- Return to the student app.
- Select `Revoke sharing`.
- Show `Sharing revoked` and `Not shared`.
- Explain that the bearer link is immediately disabled.

## 30-second “what changed my mind”

I initially thought the product would mainly be about using AI to turn a student's artifact into a polished capability statement. Building it changed my mind: the important product boundary is the student's control over the evidence trail. AI can propose, but the student reviews each proposal, the final Evidence Record is generated only from those decisions, the student explicitly approves it, and sharing can be activated or revoked by the student. That makes the product an evidence-and-contestability layer rather than an automated hiring or scoring system.

## Demo safety notes

- Use invented/demo evidence only.
- Do not use real personal data.
- The AI output is labeled as simulated when the demo fallback is used.
- The product does not produce credit scores, rankings, approval probabilities, lending recommendations, hiring recommendations, or job matches.

## Evidence captured during the build

- Production deployment: `https://evidence-packet-builder.vercel.app`
- Repository: `reginabuilds/evidence-packet-builder`
- Mechanical build failure found in Vercel: duplicate `evidence_id` in the Feature 07 review insert.
- The bug was fixed in commit `b9467b8`, and the subsequent Vercel deployment reached `Ready`.
