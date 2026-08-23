import { z } from "zod";
import { associationFirewallReason, containsAssociationEvidenceTerm, isAllowedEvidenceCategory } from "@/lib/association-firewall";

export const EVIDENCE_BUCKET = "demo-evidence";
export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "text/plain": ["txt"],
} as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

export const intakeRequestSchema = z.object({
  title: z.string().trim().min(3).max(120).refine((value) => !/[<>]/.test(value), "Title cannot contain markup."),
  category: z.string().trim().min(1).max(120),
  documentDate: z.string().regex(datePattern, "Document date must be YYYY-MM-DD.").optional(),
  fileName: z.string().trim().min(1).max(180).regex(/^[a-zA-Z0-9._ -]+$/, "File name contains unsupported characters."),
  fileSize: z.number().int().positive().max(MAX_EVIDENCE_FILE_SIZE),
  mimeType: z.string().trim(),
  fileHash: z.string().regex(sha256Pattern, "File hash must be SHA-256."),
  demoOnlyConfirmed: z.literal(true),
});

export type IntakeRequest = z.infer<typeof intakeRequestSchema>;

export function validateEvidenceIntake(value: unknown): IntakeRequest {
  const input = intakeRequestSchema.parse(value);
  const firewallReason = associationFirewallReason(input.category);
  if (firewallReason || !isAllowedEvidenceCategory(input.category)) throw new Error(firewallReason ?? "Unsupported evidence category.");
  if (containsAssociationEvidenceTerm(input.title)) {
    throw new Error("Association-based evidence is not accepted in this MVP.");
  }

  const extensions = ALLOWED_FILE_TYPES[input.mimeType as keyof typeof ALLOWED_FILE_TYPES];
  const extension = input.fileName.split(".").pop()?.toLowerCase();
  if (!extensions || !extension || !extensions.includes(extension as never)) {
    throw new Error("Only PDF, JPG, PNG, and TXT files are accepted.");
  }

  if (input.documentDate) {
    const documentDate = new Date(`${input.documentDate}T00:00:00Z`);
    const latestAllowedDate = new Date();
    latestAllowedDate.setUTCDate(latestAllowedDate.getUTCDate() + 1);
    if (Number.isNaN(documentDate.getTime()) || documentDate > latestAllowedDate) {
      throw new Error("Document date cannot be more than one day in the future.");
    }
  }

  return input;
}

export function safeObjectFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}
