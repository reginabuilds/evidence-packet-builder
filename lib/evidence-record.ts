import { z } from "zod";

const studentContextSchema = z.object({ purpose: z.string(), role: z.string(), actions: z.string(), outcome: z.string() });
const artifactSchema = z.object({ evidenceId: z.string().uuid(), title: z.string(), category: z.string(), originalFilename: z.string().nullable(), submittedAt: z.string() });
const aiProposalSchema = z.object({
  analysisId: z.string().uuid(), sourceMode: z.enum(["ai", "simulated"]), generatorName: z.string(), generatorModel: z.string().nullable(), workSummary: z.string(),
  proposedCapabilities: z.array(z.object({ capability: z.string(), evidenceBasis: z.string() })), supportingObservations: z.array(z.string()), limitations: z.array(z.string()), disclaimer: z.string(),
});

const studentApprovedInformationSchema = z.object({
  available: z.boolean(),
  note: z.string(),
  approvedAt: z.string().optional(),
});

export const evidenceRecordSchema = z.object({
  recordVersion: z.literal(1),
  status: z.enum(["draft", "approved"]),
  approvalStatus: z.enum(["not_yet_approved", "approved_by_student"]),
  studentApprovedInformation: studentApprovedInformationSchema,
  studentProvided: z.object({ artifact: artifactSchema, context: studentContextSchema }),
  aiGeneratedProposal: aiProposalSchema,
  boundaries: z.array(z.string()).min(1),
  generatedAt: z.string(),
}).superRefine((record, ctx) => {
  if (record.status === "draft" && record.approvalStatus !== "not_yet_approved") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Draft records cannot be student-approved." });
  if (record.status === "approved" && record.approvalStatus !== "approved_by_student") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Approved records must be explicitly student-approved." });
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

export function buildEvidenceRecord(input: {
  artifact: z.infer<typeof artifactSchema>; context: z.infer<typeof studentContextSchema>; aiProposal: z.infer<typeof aiProposalSchema>; generatedAt?: string;
}): EvidenceRecord {
  return evidenceRecordSchema.parse({
    recordVersion: 1, status: "draft", approvalStatus: "not_yet_approved",
    studentApprovedInformation: { available: false, note: "No information in this draft has been approved through the later student review step." },
    studentProvided: { artifact: input.artifact, context: input.context }, aiGeneratedProposal: input.aiProposal,
    boundaries: [
      "AI-generated or simulated analysis is a proposal, not verified fact.",
      "The record does not score, rank, certify, guarantee, or make hiring or job-matching decisions.",
      "The original artifact remains the source file and is not modified by record generation.",
    ], generatedAt: input.generatedAt ?? new Date().toISOString(),
  });
}

export function approveEvidenceRecord(record: EvidenceRecord, approvedAt = new Date().toISOString()): EvidenceRecord {
  if (record.status !== "draft" || record.approvalStatus !== "not_yet_approved") throw new Error("Only a draft that has not yet been approved can be approved.");
  return evidenceRecordSchema.parse({
    ...record,
    status: "approved",
    approvalStatus: "approved_by_student",
    studentApprovedInformation: { available: true, approvedAt, note: "The student explicitly approved this Evidence Record. AI-generated or simulated content remains labeled as a proposal and is not converted into verified fact." },
  });
}
