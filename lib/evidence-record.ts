import { z } from "zod";

const studentContextSchema = z.object({ purpose: z.string(), role: z.string(), actions: z.string(), outcome: z.string() });
const artifactSchema = z.object({ evidenceId: z.string().uuid(), title: z.string(), category: z.string(), originalFilename: z.string().nullable(), submittedAt: z.string() });
const supportingEvidenceSchema = z.object({ description: z.string(), reference: z.string() });
const capabilitySchema = z.object({
  capability: z.string().min(1),
  evidenceBasis: z.string().min(1),
  supportingEvidence: z.array(supportingEvidenceSchema).min(1),
  sourceProposalIndex: z.number().int().nonnegative(),
});
const aiProposalSchema = z.object({
  analysisId: z.string().uuid(), sourceMode: z.enum(["ai", "simulated"]), generatorName: z.string(), generatorModel: z.string().nullable(), workSummary: z.string(),
  proposedCapabilities: z.array(z.object({ capability: z.string(), evidenceBasis: z.string(), supportingEvidence: z.array(supportingEvidenceSchema).optional(), explanation: z.string().optional() })),
  supportingObservations: z.array(z.string()), limitations: z.array(z.string()), disclaimer: z.string(),
});
const studentApprovedInformationSchema = z.object({ available: z.boolean(), note: z.string(), approvedAt: z.string().optional() });

export const evidenceRecordSchema = z.object({
  recordVersion: z.literal(1),
  status: z.enum(["draft", "pending_review", "approved"]),
  approvalStatus: z.enum(["not_yet_approved", "approved_by_student"]),
  studentApprovedInformation: studentApprovedInformationSchema,
  studentProvided: z.object({ artifact: artifactSchema, context: studentContextSchema }),
  aiGeneratedProposal: aiProposalSchema,
  finalizedCapabilities: z.array(capabilitySchema),
  reviewSummary: z.object({ analysisId: z.string().uuid(), totalProposals: z.number().int().nonnegative(), reviewedProposals: z.number().int().nonnegative(), acceptedProposals: z.number().int().nonnegative() }),
  boundaries: z.array(z.string()).min(1),
  generatedAt: z.string(),
}).superRefine((record, ctx) => {
  if (record.status !== "approved" && record.approvalStatus !== "not_yet_approved") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unapproved records cannot be student-approved." });
  if (record.status === "approved" && record.approvalStatus !== "approved_by_student") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Approved records must be explicitly student-approved." });
  if (record.reviewSummary.reviewedProposals !== record.reviewSummary.totalProposals) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "All AI proposals must be reviewed before finalization." });
  for (const capability of record.finalizedCapabilities) if (capability.supportingEvidence.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Every finalized capability must have supporting evidence." });
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

type BuildInput = {
  artifact: z.infer<typeof artifactSchema>;
  context: z.infer<typeof studentContextSchema>;
  aiProposal: z.infer<typeof aiProposalSchema>;
  finalizedCapabilities: z.infer<typeof capabilitySchema>[];
  generatedAt?: string;
};

export function buildEvidenceRecord(input: BuildInput): EvidenceRecord {
  return evidenceRecordSchema.parse({
    recordVersion: 1,
    status: "pending_review",
    approvalStatus: "not_yet_approved",
    studentApprovedInformation: { available: false, note: "The student has reviewed the AI proposals. This record still requires explicit student approval." },
    studentProvided: { artifact: input.artifact, context: input.context },
    aiGeneratedProposal: input.aiProposal,
    finalizedCapabilities: input.finalizedCapabilities,
    reviewSummary: {
      analysisId: input.aiProposal.analysisId,
      totalProposals: input.aiProposal.proposedCapabilities.length,
      reviewedProposals: input.aiProposal.proposedCapabilities.length,
      acceptedProposals: input.finalizedCapabilities.length,
    },
    boundaries: [
      "AI-generated or simulated analysis is a proposal, not verified fact.",
      "Only capabilities explicitly accepted by the student appear in finalizedCapabilities.",
      "The record does not score, rank, certify, guarantee, or make hiring or job-matching decisions.",
      "The original artifact remains the source file and is not modified by review or record generation.",
    ],
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  });
}

export function approveEvidenceRecord(record: EvidenceRecord, approvedAt = new Date().toISOString()): EvidenceRecord {
  if (record.status !== "pending_review" || record.approvalStatus !== "not_yet_approved") throw new Error("Only a pending Evidence Record can be approved.");
  return evidenceRecordSchema.parse({
    ...record,
    status: "approved",
    approvalStatus: "approved_by_student",
    studentApprovedInformation: { available: true, approvedAt, note: "The student explicitly approved this Evidence Record. AI-generated or simulated content remains labeled as a proposal and is not converted into verified fact." },
  });
}
