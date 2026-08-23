import { describe, expect, it } from "vitest";
import { validateEvidenceIntake } from "@/lib/evidence-intake";

const valid = { title: "Demo market receipt", category: "sales_receipt", documentDate: "2026-08-20", fileName: "demo-receipt.pdf", fileSize: 1024, mimeType: "application/pdf", fileHash: "a".repeat(64), demoOnlyConfirmed: true };

describe("evidence intake validation", () => {
  it("accepts an allowlisted demo PDF", () => expect(validateEvidenceIntake(valid)).toMatchObject({ category: "sales_receipt" }));
  it("rejects disallowed types and unconfirmed demo data", () => {
    expect(() => validateEvidenceIntake({ ...valid, mimeType: "application/zip", fileName: "evidence.zip" })).toThrow("Only PDF, JPG, PNG, and TXT");
    expect(() => validateEvidenceIntake({ ...valid, demoOnlyConfirmed: false })).toThrow();
  });
  it("rejects association-derived categories and titles", () => {
    expect(() => validateEvidenceIntake({ ...valid, category: "community_referral" })).toThrow("Association-based evidence");
    expect(() => validateEvidenceIntake({ ...valid, title: "Referral contact receipt" })).toThrow("Association-based evidence");
  });
});
