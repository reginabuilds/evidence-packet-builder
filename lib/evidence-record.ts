import { z } from "zod";

const studentContextSchema = z.object({
  purpose: z.string(),
  role: z.string(),
  actions: z.string(),
  outcome: z.string(),
});

const artifactSchema = z.object({
  evidenceId: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  originalFilename: z.string().nullable(),
  submittedAt: z.string(),
});

const aiProposalSchema = z.object({
  analysisId: z.string().uuid(),
  sourceMode: z.enum(["ai", "simulated"]),
  generatorName: z.string(),
  generatorModel: z.string().nullable(),
  workSummary: z.string(),
  proposedCapabilities: z.array(z.object({ capability: z.string(), evidenceBasis: z.string() })),
  supportingObservations: z.array(z.string()),
  limitations: z.array(z.string()),
  disclaimer: z.string(),
});

export const evidenceRecordSchema = z.object({
  recordVersion: z.literal(1),
  status: z.literal("draft"),
  approvalStatus: z.literal("not_yet_approved"),
  studentApprovedInformation: z.object({
    available: z.literal(false),
    note: z.literal("No information in this draft has been approved through the later student review step.")
  }),
  studentProvided: z.object({
    artifact: artifactSchema,
    context: studentContextSchema,
  }),
  aiGeneratedProposal: aiProposalSchema,
  boundaries: z.array(z.string()).min(1),
  generatedAt: z.string(),
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

export function buildEvidenceRecord(input: {
  artifact: z.infer<typeof artifactSchema>;
  context: z.infer<typeof studentContextSchema>;
  aiProposal: z.infer<typeof aiProposalSchema>;
  generatedAt?: string;
}): EvidenceRecord {
  return evidenceRecordSchema.parse({
    recordVersion: 1,
    status: "draft",
    approvalStatus: "not_yet_approved",
    studentApprovedInformation: {
      available: false,
      note: "No information in this draft has been approved through the later student review step.",
    },
    studentProvided: {
      artifact: input.artifact,
      context: input.context,
    },
    aiGeneratedProposal: input.aiProposal,
    boundaries: [
      "AI-generated or simulated analysis is a proposal, not verified fact.",
      "The record does not score, rank, certify, guarantee, or make hiring or job-matching decisions.",
      "The original artifact remains the source file and is not modified by record generation.",
    ],
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  });
}
