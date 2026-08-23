import { describe, expect, it } from "vitest";
import { extractStructuredEvidence, uncertainFields } from "@/lib/evidence-extraction";
import { reviewRoutingForUncertainty } from "@/lib/review-routing";

describe("uncertainty routing", () => {
  it("sends deterministic low-confidence extraction fields to an open human review item", async () => {
    const result = await extractStructuredEvidence({ title: "Demo receipt", category: "sales_receipt", documentDate: "2026-08-20", fileName: null, mimeType: null, content: null });
    const uncertain = uncertainFields(result.extraction);
    expect(uncertain.length).toBeGreaterThan(0);
    expect(reviewRoutingForUncertainty(uncertain)).toEqual({ verificationStatus: "pending_review", reviewState: "open", reasonCode: "low_confidence" });
  });
  it("does not create a review routing result when no fields are uncertain", () => expect(reviewRoutingForUncertainty([])).toBeNull());
});
