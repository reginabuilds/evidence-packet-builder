import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export function createShareToken() {
  return randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicApprovedRecord(record: unknown) {
  const parsed = record as {
    recordVersion: number;
    status: string;
    approvalStatus: string;
    studentApprovedInformation: { available: boolean; note: string; approvedAt?: string };
    studentProvided: { artifact: { title: string; category: string; originalFilename: string | null; submittedAt: string }; context: { purpose: string; role: string; actions: string; outcome: string } };
    aiGeneratedProposal: { sourceMode: "ai" | "simulated"; generatorName: string; generatorModel: string | null; workSummary: string; proposedCapabilities: Array<{ capability: string; evidenceBasis: string }>; supportingObservations: string[]; limitations: string[]; disclaimer: string };
    boundaries: string[];
    generatedAt: string;
  };

  if (parsed.status !== "approved" || parsed.approvalStatus !== "approved_by_student") {
    throw new Error("Only an approved Evidence Record can be shared.");
  }

  return {
    recordVersion: parsed.recordVersion,
    status: "approved",
    approvalStatus: "approved_by_student",
    studentApprovedInformation: parsed.studentApprovedInformation,
    studentProvided: parsed.studentProvided,
    aiGeneratedProposal: parsed.aiGeneratedProposal,
    boundaries: parsed.boundaries,
    generatedAt: parsed.generatedAt,
  };
}
