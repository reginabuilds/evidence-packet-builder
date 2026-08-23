import { describe, expect, it } from "vitest";
import { validateCorrection } from "@/lib/evidence-correction";
import { applyApplicantCorrection } from "@/lib/correction-history";
import { evidenceExtractionSchema } from "@/lib/evidence-extraction";

const extraction = evidenceExtractionSchema.parse({ evidenceType: "sales receipt", issuerOrSourceName: "Fictional demo source", documentDate: "2026-08-20", activityDate: "2026-08-20", amount: 50, currency: "MXN", statedActivity: "Demo sale", confidence: { evidenceType: 0.9, issuerOrSourceName: 0.8, documentDate: 0.9, activityDate: 0.8, amount: 0.8, currency: 0.9, statedActivity: 0.9 }, extractionNotes: "Demo" });

describe("applicant correction history", () => {
  it("preserves the original extracted value while creating a corrected version", () => {
    const correction = validateCorrection({ field: "amount", value: 75, reason: "The fictional receipt amount was entered incorrectly." });
    const result = applyApplicantCorrection(extraction, correction);
    expect(result.originalValue).toBe(50); expect(result.corrected.amount).toBe(75); expect(extraction.amount).toBe(50);
  });
  it("rejects null for a required extracted field before the correction workflow", () => expect(() => validateCorrection({ field: "evidenceType", value: null, reason: "Incorrect" })).toThrow());
});
