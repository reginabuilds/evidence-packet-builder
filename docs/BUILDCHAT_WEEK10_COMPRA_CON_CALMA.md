# BUILDCHAT — Week 10: Compra con Calma

## Goal
Build a buyer-side pre-checkout regret-prevention/autonomy check. The slice should help the buyer surface unknowns and apply their own criteria, not direct demand to sellers.

## Implementation decisions
- Reuse the existing Next.js 15 / React 19 repository and add an isolated /week10 route.
- Put the interaction in a static page under public/compra-con-calma/index.html.
- Keep the demo client-side and dependency-free.
- Collect product name, advertised price, shipping/extra charges, return-policy understanding, evidence type, must-have requirement, budget fit and pressure/urgency.
- Calculate only the sum of user-entered costs; clearly describe the result as not a quote.
- Produce a checklist of missing checks. Never return a buy/don't-buy verdict.
- Do not add seller search/ranking, affiliate links, commissions, accounts, persistent storage, or purchase actions.

## Test plan
1. Check total arithmetic with price 1000 and extras 100.
2. Check each missing-condition branch.
3. Check edit/back interaction and mobile layout.
4. Confirm copy avoids seller verification claims and purchase commands.
5. Run repository typecheck/build and browser checks before claiming completion.

## Evidence honesty
This document records implementation intent and decisions, not a verbatim transcript. Automated build and persona test outcomes must be added only after they are actually run. The persona walkthrough is not yet recorded.
