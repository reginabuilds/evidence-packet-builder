import type { EvidenceExtraction } from "@/lib/evidence-extraction";
import type { CorrectionInput } from "@/lib/evidence-correction";

export function applyApplicantCorrection(extraction: EvidenceExtraction, correction: CorrectionInput) {
  const originalValue = extraction[correction.field];
  const corrected = { ...extraction, [correction.field]: correction.value } as EvidenceExtraction;
  return { originalValue, corrected };
}
