import { describe, expect, it } from "vitest";
import { hashShareToken, publicApprovedRecord, shareTokenSchema } from "@/lib/evidence-sharing";

const approvedRecord = {
  recordVersion: 1,
  status: "approved",
  approvalStatus: "approved_by_student",
  studentApprovedInformation: { available: true, note: "Approved by the student.", approvedAt: "2026-09-05T00:00:00.000Z" },
  studentProvided: {
    artifact: { evidenceId: "00000000-0000-4000-8000-000000000001", title: "Demo artifact", category: "invoice", originalFilename: "demo.pdf", submittedAt: "2026-09-05T00:00:00.000Z" },
    context: { purpose: "Complete a bounded demo task.", role: "Student operator", actions: "Prepared the artifact.", outcome: "Produced the submitted artifact." },
  },
  aiGeneratedProposal: {
    analysisId: "00000000-0000-4000-8000-000000000002", sourceMode: "simulated", generatorName: "deterministic-simulated-analysis", generatorModel: null,
    workSummary: "A bounded demo task is described.", proposedCapabilities: [{ capability: "Evidence-backed execution", evidenceBasis: "The artifact describes concrete work." }], supportingObservations: ["The artifact is associated with the student."], limitations: ["The proposal does not establish broader capability."], disclaimer: "AI-generated proposal; not verified fact.",
  },
  boundaries: ["No scores, rankings, certificates, guarantees, or hiring decisions."],
  generatedAt: "2026-09-05T00:00:00.000Z",
};

describe("Feature 09 sharing", () => {
  it("accepts the expected bearer-token shape and hashes it", () => {
    const token = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno1234567890_-".slice(0, 43);
    expect(shareTokenSchema.safeParse(token).success).toBe(true);
    expect(hashShareToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("shares only the approved record and strips internal IDs", () => {
    const shared = publicApprovedRecord(approvedRecord);
    expect(shared.status).toBe("approved");
    expect(shared.approvalStatus).toBe("approved_by_student");
    expect((shared.studentProvided.artifact as { evidenceId?: string }).evidenceId).toBeUndefined();
    expect((shared.aiGeneratedProposal as { analysisId?: string }).analysisId).toBeUndefined();
  });

  it("rejects an unapproved record", () => {
    expect(() => publicApprovedRecord({ ...approvedRecord, status: "draft", approvalStatus: "not_yet_approved" })).toThrow();
  });
});
