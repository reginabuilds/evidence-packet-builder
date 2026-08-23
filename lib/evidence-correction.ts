import { z } from "zod";
import { containsAssociationEvidenceTerm } from "@/lib/association-firewall";

export const CORRECTABLE_FIELDS = ["evidenceType", "issuerOrSourceName", "documentDate", "activityDate", "amount", "currency", "statedActivity"] as const;
export type CorrectableField = (typeof CORRECTABLE_FIELDS)[number];

const correctionSchema = z.object({
  field: z.enum(CORRECTABLE_FIELDS),
  value: z.unknown(),
  reason: z.string().trim().min(1).max(2000).refine((value) => !/[<>]/.test(value), "Correction reason cannot contain markup."),
});

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type CorrectionInput = { field: CorrectableField; value: string | number | null; reason: string };

export function validateCorrection(value: unknown): CorrectionInput {
  const input = correctionSchema.parse(value);
  const candidate = input.value;
  let validated: string | number | null;

  if (candidate === null) {
    validated = null;
  } else if (input.field === "amount") {
    validated = z.number().finite().nonnegative().max(1_000_000_000).parse(candidate);
  } else if (input.field === "currency") {
    validated = z.string().trim().regex(/^[A-Z]{3}$/).parse(candidate);
  } else if (input.field === "documentDate" || input.field === "activityDate") {
    validated = z.string().regex(datePattern).parse(candidate);
    const date = new Date(`${validated}T00:00:00Z`);
    const latest = new Date();
    latest.setUTCDate(latest.getUTCDate() + 1);
    if (Number.isNaN(date.getTime()) || date > latest) throw new Error("Corrected dates cannot be more than one day in the future.");
  } else if (input.field === "evidenceType") {
    validated = z.string().trim().min(1).max(120).refine((text) => !/[<>]/.test(text)).parse(candidate);
  } else if (input.field === "issuerOrSourceName") {
    validated = z.string().trim().min(1).max(200).refine((text) => !/[<>]/.test(text)).parse(candidate);
  } else {
    validated = z.string().trim().min(1).max(500).refine((text) => !/[<>]/.test(text)).parse(candidate);
  }

  if (typeof validated === "string" && containsAssociationEvidenceTerm(validated)) {
    throw new Error("Association-based evidence is not accepted in this MVP.");
  }
  return { field: input.field, value: validated, reason: input.reason };
}

export const exclusionSchema = z.object({
  reason: z.string().trim().min(1).max(2000).refine((value) => !/[<>]/.test(value), "Exclusion reason cannot contain markup."),
});
