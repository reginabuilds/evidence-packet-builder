import { z } from "zod";

const confidenceSchema = z.number().min(0).max(1);

export const evidenceExtractionSchema = z.object({
  evidenceType: z.string().min(1).max(120),
  issuerOrSourceName: z.string().min(1).max(200).nullable(),
  documentDate: z.string().date().nullable(),
  activityDate: z.string().date().nullable(),
  amount: z.number().nonnegative().max(1_000_000_000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  statedActivity: z.string().min(1).max(500).nullable(),
  confidence: z.object({
    evidenceType: confidenceSchema,
    issuerOrSourceName: confidenceSchema,
    documentDate: confidenceSchema,
    activityDate: confidenceSchema,
    amount: confidenceSchema,
    currency: confidenceSchema,
    statedActivity: confidenceSchema,
  }),
  extractionNotes: z.string().max(1000),
});

export type EvidenceExtraction = z.infer<typeof evidenceExtractionSchema>;

export type ExtractionInput = {
  title: string;
  category: string;
  documentDate: string | null;
  fileName: string | null;
  mimeType: string | null;
  content: Uint8Array | null;
};

export type ExtractionResult = {
  extraction: EvidenceExtraction;
  extractorName: string;
  extractorModel: string | null;
};

const EXTRACTION_PROMPT = `You extract structured fields from a single item of invented demo economic evidence.
Return only JSON matching the supplied schema. Extract only what is directly stated; use null when unavailable.
Confidence is a number from 0 to 1 for each field, reflecting extraction certainty only.
You must not verify authenticity, decide truthfulness, score an applicant, rank creditworthiness, estimate approval probability, recommend a loan, or make any lending decision.`;

function mockExtraction(input: ExtractionInput): EvidenceExtraction {
  const categoryLabel = input.category.replaceAll("_", " ");
  return evidenceExtractionSchema.parse({
    evidenceType: categoryLabel,
    issuerOrSourceName: "Fictional demo source",
    documentDate: input.documentDate,
    activityDate: input.documentDate,
    amount: null,
    currency: "MXN",
    statedActivity: `Invented demo ${categoryLabel}.`,
    confidence: {
      evidenceType: 0.98,
      issuerOrSourceName: 0.72,
      documentDate: input.documentDate ? 0.91 : 0.2,
      activityDate: input.documentDate ? 0.62 : 0.2,
      amount: 0.15,
      currency: 0.7,
      statedActivity: 0.84,
    },
    extractionNotes: "Deterministic demo extraction. It is not a verification or lending assessment.",
  });
}

function responseText(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const value = response as { output_text?: unknown; output?: unknown };
  if (typeof value.output_text === "string") return value.output_text;
  if (!Array.isArray(value.output)) return null;
  for (const item of value.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") return (part as { text: string }).text;
    }
  }
  return null;
}

function base64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

async function llmExtraction(input: ExtractionInput): Promise<ExtractionResult> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return { extraction: mockExtraction(input), extractorName: "deterministic-demo-extractor", extractorModel: null };

  const content: Array<Record<string, string>> = [{
    type: "input_text",
    text: `${EXTRACTION_PROMPT}\n\nEvidence metadata:\n${JSON.stringify({ title: input.title, category: input.category, documentDate: input.documentDate, fileName: input.fileName })}`,
  }];
  if (input.content && input.mimeType === "text/plain") {
    content.push({ type: "input_text", text: `Document text:\n${new TextDecoder().decode(input.content.slice(0, 200_000))}` });
  } else if (input.content && input.mimeType?.startsWith("image/")) {
    content.push({ type: "input_image", image_url: `data:${input.mimeType};base64,${base64(input.content)}` });
  } else if (input.content && input.mimeType === "application/pdf") {
    content.push({ type: "input_file", filename: input.fileName ?? "demo-evidence.pdf", file_data: `data:application/pdf;base64,${base64(input.content)}` });
  }

  const model = process.env.LLM_MODEL ?? "gpt-4.1-mini";
  const response = await fetch(process.env.LLM_API_URL ?? "https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "evidence_extraction", strict: true, schema: z.toJSONSchema(evidenceExtractionSchema) } },
    }),
  });
  if (!response.ok) throw new Error("The extraction service did not return a valid response.");
  const text = responseText(await response.json());
  if (!text) throw new Error("The extraction service returned no structured output.");
  return { extraction: evidenceExtractionSchema.parse(JSON.parse(text)), extractorName: "llm-api", extractorModel: model };
}

export function uncertainFields(extraction: EvidenceExtraction) {
  const requiredFields: Array<keyof Pick<EvidenceExtraction, "evidenceType" | "issuerOrSourceName" | "documentDate" | "activityDate" | "amount" | "currency" | "statedActivity">> = ["evidenceType", "issuerOrSourceName", "documentDate", "activityDate", "amount", "currency", "statedActivity"];
  return requiredFields.filter((field) => extraction[field] === null || extraction.confidence[field] < 0.8);
}

export async function extractStructuredEvidence(input: ExtractionInput): Promise<ExtractionResult> {
  return llmExtraction(input);
}
