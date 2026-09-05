import { describe, expect, it } from "vitest";
import { approveEvidenceRecord, buildEvidenceRecord } from "@/lib/evidence-record";

const input = {
  artifact: { evidenceId: "00000000-0000-4000-8000-000000000001", title: "Demo artifact", category: "invoice", originalFilename: "demo.pdf", submittedAt: "2026-09-05T00:00:00.000Z" },
  context: { purpose: "Complete a bounded demo task.", role: "Student operator", actions: "Prepared and documented the demo task.", outcome: "Produced the submitted artifact." },
  aiProposal: { analysisId: "00000000-0000-4000-8000-000000000002", sourceMode: "simulated" as const, generatorName: "deterministic-simulated-analysis", generatorModel: null, workSummary: "A bounded demo task is described by the artifact and student context.", proposedCapabilities: [{ capability: "Evidence-backed execution", evidenceBasis: "The artifact and context describe concrete actions taken during the task." }], supportingObservations: ["The submitted artifact is associated with the student's account."], limitations: ["The proposal does not independently establish broader capability."], disclaimer: "AI-generated proposal. This analysis is not verified fact and does not certify, score, rank, or guarantee capability." },
};

describe("Evidence Record review and approval", () => {
  it("requires an explicit approval transition and preserves the AI proposal boundary", () => {
    const draft = buildEvidenceRecord(input);
    expect(draft.status).toBe("draft");
    expect(draft.approvalStatus).toBe("not_yet_approved");
    const approved = approveEvidenceRecord(draft, "2026-09-05T01:00:00.000Z");
    expect(approved.status).toBe("approved");
    expect(approved.approvalStatus).toBe("approved_by_student");
    expect(approved.studentApprovedInformation.available).toBe(true);
    expect(approved.aiGeneratedProposal.sourceMode).toBe("simulated");
    expect(approved.aiGeneratedProposal.disclaimer).toContain("not verified fact");
  });

  it("does not allow approval to be repeated", () => {
    const draft = buildEvidenceRecord(input);
    const approved = approveEvidenceRecord(draft);
    expect(() => approveEvidenceRecord(approved)).toThrow();
  });
});
