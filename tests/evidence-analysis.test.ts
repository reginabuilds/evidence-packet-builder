import { describe, expect, it } from "vitest";
import { aiAnalysisSchema } from "@/lib/evidence-analysis";

const disclaimer = "AI-generated proposal. This analysis is not verified fact and does not certify, score, rank, or guarantee capability." as const;

describe("AI analysis proposal schema", () => {
  it("accepts a non-scored evidence-backed proposal", () => {
    const parsed = aiAnalysisSchema.parse({
      workSummary: "The artifact and student context describe completion of a bounded work task.",
      proposedCapabilities: [{ capability: "Evidence-backed execution", evidenceBasis: "The submitted work and student context describe concrete actions taken during the task." }],
      supportingObservations: ["The artifact is associated with the authenticated student's submitted evidence."],
      limitations: ["The proposal does not independently establish broader or future capability."],
      disclaimer,
    });
    expect(parsed.disclaimer).toBe(disclaimer);
  });

  it("does not include score or ranking fields in the schema", () => {
    const parsed = aiAnalysisSchema.parse({
      workSummary: "The artifact and student context describe completion of a bounded work task.",
      proposedCapabilities: [{ capability: "Evidence-backed execution", evidenceBasis: "The submitted work and student context describe concrete actions taken during the task." }],
      supportingObservations: ["The artifact is associated with the authenticated student's submitted evidence."],
      limitations: ["The proposal does not independently establish broader or future capability."],
      disclaimer,
      score: 99,
      rank: 1,
    });
    expect("score" in parsed).toBe(false);
    expect("rank" in parsed).toBe(false);
  });
});
