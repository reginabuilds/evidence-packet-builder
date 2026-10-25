# Week 11 implementation prompt — Agua a Tiempo MX

Build only the scoped working slice described in [PACKET_WEEK11_AGUA_A_TIEMPO.md](./PACKET_WEEK11_AGUA_A_TIEMPO.md). Do not change the earlier Week 7 or Week 8 artifacts.

## User story
As a household member planning around uncertain water supply, I need to edit an estimate of the water I have, understand the assumptions behind a rough reserve-days calculation, and distinguish simulated/pending incident notices from a human-confirmed official notice.

## Small features and acceptance criteria
1. **Reserve ledger**
   - Inputs: integer liters (1–100,000) and household size (1–30).
   - Reject invalid, blank, decimal, negative, and out-of-range values with Spanish errors.
   - Show formula and the 70 L/person/day planning assumption.
   - Mark the estimate as manual and indicative; no claim that it predicts real consumption.
2. **Sensing layer**
   - Provide a phone/manual input and a simulated sensor reading.
   - Label the simulated IoT feed on the screen; do not imply a physical sensor exists.
3. **ML layer**
   - ML output must be labeled simulated. Use deterministic calculations for reserve days; do not generate predictions, causes, restoration times, or water-quality claims.
4. **Notice ledger**
   - Sample incident is fictional and visibly marked SIMULACIÓN.
   - Display source, confirmation owner, last update, next update, and correction path.
   - Pending status must never be styled or worded as an official confirmed notice.
5. **Third stack / geodata + workflow**
   - Use a schematic service-zone label only; do not show household coordinates or a public household map.
   - Show source-owner-status-correction-next-update workflow.
6. **Preparation checklist**
   - Five checkboxes update a visible progress count.
   - State stays in memory for this browser session only.
7. **Security and shadow clause**
   - No secrets, personal data, server-side persistence, mandatory app claim, or real SMS sending.
   - Document an SMS/offline contact route as a service requirement; do not claim this prototype sends it.
   - If persistence or personal accounts are later introduced, pause launch until Supabase Auth and per-user RLS are implemented.
8. **Accessibility**
   - Responsive phone layout, labels, keyboard focus, live feedback for validation, readable Spanish, and adequate contrast.

## Commit plan
1. docs: add Week 11 packet before implementation
2. feat: build reserve ledger and notice workflow
3. feat: switch home to Agua a Tiempo
4. test: document mechanical and persona test results
5. docs: add session close and demo instructions

## Test and release gate
- Run the form validation cases and manually inspect mobile and desktop layout.
- Confirm the simulated-data labels are visible and no official event is falsely asserted.
- Perform at least one mechanical test, record a real bug observed, fix it, and redeploy.
- Perform the persona test in a fresh chat using screenshots; document actual confusion and the fix. Never invent completed test evidence.
- Review the live URL and record both deployment URLs after actual deployments.
