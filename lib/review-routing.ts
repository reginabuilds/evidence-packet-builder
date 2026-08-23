export function reviewRoutingForUncertainty(uncertainFields: string[]) {
  return uncertainFields.length
    ? { verificationStatus: "pending_review" as const, reviewState: "open" as const, reasonCode: "low_confidence" as const }
    : null;
}
