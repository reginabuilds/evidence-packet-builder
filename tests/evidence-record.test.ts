import { describe, expect, it } from "vitest";
import { buildEvidenceRecord } from "@/lib/evidence-record";

describe("Evidence Record", () => {
  it("keeps student-provided information separate from the AI proposal", () => {
    const record = buildEvidenceRecord({
      artifact: { evidenceId: "00000000-0000-4000-8000-000000000001", title: "Demo artifact", category: "invoice", originalFilename: "demo.pdf", submittedAt: "2026-09-05T00:00:00.000Z" },
      context: { purpose: "Complete a bounded demo task.", role: "Student operator", actions: "Prepared and documented the demo task.", outcome: "Produced the submitted artifact." },
      aiProposal: { analysisId: "00000000-0000-4000-8000-000000000002", sourceMode: "simulated", generatorName: "deterministic-simulated-analysis", generatorModel: null, workSummary: "A bounded demo task is described by the artifact and student context.", proposedCapabilities: [{ capability: "Evidence-backed execution", evidenceBasis: "The artifact and context describe concrete actions taken during the task." }], supportingObservations: ["The submitted artifact is associated with the student's account."], limitations: ["The proposal does not independently establish broader capability."], disclaimer: "AI-generated proposal. This analysis is not verified fact and does not certify, score, rank, or guarantee capability." },
    });
    expect(record.status).toBe("draft");
    expect(record.approvalStatus).toBe("not_yet_approved");
    expect(record.studentApprovedInformation.available).toBe(false);
    expect(record.studentProvided.context.actions).toContain("Prepared");
    expect(record.aiGeneratedProposal.sourceMode).toBe("simulated");
  });
});
