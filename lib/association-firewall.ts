/** Only evidence the applicant can inspect and challenge is accepted by this MVP. */
export const ALLOWED_EVIDENCE_CATEGORIES = [
  "sales_receipt",
  "bank_deposit_record",
  "invoice",
  "utility_service_receipt",
  "self_reported_activity_note",
] as const;

export type AllowedEvidenceCategory = (typeof ALLOWED_EVIDENCE_CATEGORIES)[number];

const ASSOCIATION_TERMS = /contact|relative|family|neighbor|neighbour|community|network|social graph|group membership|reputation|referral|affiliate|association/i;

export function isAllowedEvidenceCategory(value: string): value is AllowedEvidenceCategory {
  return ALLOWED_EVIDENCE_CATEGORIES.includes(value as AllowedEvidenceCategory);
}

export function associationFirewallReason(category: string): string | null {
  if (isAllowedEvidenceCategory(category)) return null;
  if (ASSOCIATION_TERMS.test(category)) {
    return "Association-based evidence is not accepted in this MVP.";
  }
  return "This evidence category is not accepted in this MVP.";
}

export function containsAssociationEvidenceTerm(value: string): boolean {
  return ASSOCIATION_TERMS.test(value);
}
