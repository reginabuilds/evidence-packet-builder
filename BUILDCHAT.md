# BUILDCHAT — EVIDENCE

## Build transcript / decision log

### Product
EVIDENCE — one student → one real artifact → one structured Evidence Record → one employer-readable share page.

### Starting constraints
- Student owns the evidence trajectory and release decision.
- AI can propose evidence-backed capabilities, but cannot approve, certify, score, rank, or make hiring/lending decisions.
- Student review is required before an Evidence Record can be finalized.
- Only an approved Evidence Record can be shared.
- Sharing is revocable.
- Demo data is invented only; no real personal data or secrets.

## Implementation sequence

1. **Evidence intake** — student uploads an invented evidence artifact with validation and private storage.
2. **Student context** — student records purpose, role, actions, and outcome for the artifact.
3. **AI analysis proposal** — system creates structured, evidence-backed capability proposals. Simulated AI is explicitly labeled.
4. **Student review** — student accepts, rejects, removes, or edits proposals. AI output does not count as approval.
5. **Evidence Record** — system generates the record only from student decisions. Unreviewed proposals block generation.
6. **Student approval** — record remains `pending_review` until the student explicitly approves it; approval changes status to `approved`.
7. **Sharing control** — student activates a bearer link only for an approved record and can revoke it.

## Important build/debug evidence

### Bug found
After evidence upload, the form attempted to call `event.currentTarget.reset()` after an awaited operation. React had already cleared `currentTarget`, producing:

`Cannot read properties of null (reading 'reset')`

### Fix
The fragile form reset was removed so the successful save flow no longer depends on a cleared React event target.

### Second build bug
Vercel failed the Feature 08 deployment because `evidence_id` was specified more than once in the student-review insert object in `app/api/evidence/review/route.ts`.

### Fix + redeploy
The duplicate `evidence_id` was removed and the corrected commit was deployed successfully. Vercel subsequently reported the deployment as **Ready**.

## Validation performed

- Supabase connection and authentication were configured with demo accounts.
- Invented evidence file `demo_market_sales_receipt.txt` was uploaded successfully.
- Student context was saved successfully.
- Feature 06 produced an explicitly labeled simulated-AI proposal.
- Feature 07 student decisions were stored separately from the AI proposal.
- Feature 08 generated a `pending_review` Evidence Record from student review decisions.
- Student approval changed the record to `approved` / `approved_by_student`.
- Feature 09 generated a share link for the approved record.
- The share link was opened in an incognito window without signing in and returned only the approved Evidence Record.
- Sharing was then revoked and the UI confirmed `Not shared` with the message that the shared link no longer provides access.

## Final product boundary

EVIDENCE organizes and traces student-provided evidence. It does not create a credit score, ranking, approval probability, hiring recommendation, job match, or certification. AI remains proposal-only, and the student controls what becomes part of the final Evidence Record and whether that approved record is shared.

## Demo data disclosure

All evidence shown for this demo is fictional and created only for product testing. No real person, employer, customer, bank account, or financial record is represented.
