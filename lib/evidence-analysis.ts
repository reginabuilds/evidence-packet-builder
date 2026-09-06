import { z } from "zod";

export const supportingEvidenceSchema = z.object({
  description: z.string().trim().min(10).max(700),
  reference: z.string().trim().min(2).max(300),
}).strict();

export const proposedCapabilitySchema = z.object({
  capability: z.string().trim().min(2).max(120),
  supportingEvidence: z.array(supportingEvidenceSchema).min(1).max(6),
  explanation: z.string().trim().min(10).max(900),
  // Retained for compatibility with the existing downstream record code.
  // Feature 06 UI and contract use supportingEvidence + explanation.
  evidenceBasis: z.string().trim().min(10).max(700),
}).strict();

export const aiAnalysisSchema = z.object({
  workSummary: z.string().trim().min(20).max(1200),
  proposedCapabilities: z.array(proposedCapabilitySchema).min(1).max(5),
  supportingObservations: z.array(z.string().trim().min(10).max(700)).min(1).max(6),
  limitations: z.array(z.string().trim().min(10).max(700)).min(1).max(6),
  disclaimer: z.literal("AI-generated proposal. This analysis is not verified fact and does not certify, score, rank, or guarantee capability."),
}).strict();

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;

export type AnalysisInput = {
  title: string;
  category: string;
  fileName: string | null;
  mimeType: string | null;
  content: Uint8Array | null;
  context: {
    purpose: string;
    role: string;
    actions: string;
    outcome: string;
  };
};

export type AnalysisResult = {
  analysis: AiAnalysis;
  generatorName: string;
  generatorModel: string | null;
  sourceMode: "ai" | "simulated";
};

const DISCLAIMER = "AI-generated proposal. This analysis is not verified fact and does not certify, score, rank, or guarantee capability." as const;

const ANALYSIS_PROMPT = `You analyze one authenticated student's submitted work artifact together with context written by that student.
Your output is a proposal only. It is not a certification, verification, ranking, score, hiring recommendation, career recommendation, learning path, or prediction.
Identify only observable evidence-backed capability proposals supported by identifiable evidence in the submitted artifact and relevant student-provided context.
For every proposed capability, answer: "What in the artifact supports this evidence-backed capability?"
Every proposal must include:
- capability
- supportingEvidence: one or more items with a concrete description and identifiable reference
- explanation: why that evidence supports the proposed capability
- evidenceBasis: a concise compatibility summary of the same evidence basis
Do not infer a capability from student context alone when the artifact does not provide supporting evidence.
Do not produce numeric skill scores, confidence percentages, rankings, grades, badges, certificates, verified-skill claims, trajectory recommendations, career recommendations, job recommendations, job matching, tutoring, hiring decisions, future-performance predictions, or guarantees.
Do not call any capability "verified", "certified", "proven", or "guaranteed".
Clearly state limitations, including when artifact content cannot be directly inspected.
Return only JSON matching the supplied schema.`;

const forbiddenOutputPatterns = [
  /\b(?:score|scored|scoring)\b/i,
  /\b(?:rank|ranked|ranking)\b/i,
  /\b(?:certificate|certified|certification)\b/i,
  /\bverified skill\b/i,
  /\bguarantee(?:d|s)?\b/i,
  /\bjob match(?:ing)?\b/i,
  /\btrajectory\b/i,
  /\bhiring recommendation\b/i,
  /\bshould hire\b/i,
  /\bhiring decision\b/i,
  /\bcareer recommendation\b/i,
  /\bjob recommendation\b/i,
  /\blearning path\b/i,
  /\bfuture (?:job )?performance\b/i,
  /\bact as a tutor\b/i,
];

export function assertSafeAnalysis(analysis: AiAnalysis) {
  const validated = aiAnalysisSchema.parse(analysis);
  const proposalText = JSON.stringify(validated.proposedCapabilities);
  if (forbiddenOutputPatterns.some((pattern) => pattern.test(proposalText))) {
    throw new Error("AI analysis contained unsupported capability output and was not saved.");
  }
  return validated;
}

function excerpt(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

function simulatedAnalysis(input: AnalysisInput): AiAnalysis {
  const category = input.category.replaceAll("_", " ");
  const fileReference = input.fileName ?? input.title;
  const artifactText = input.content && input.mimeType === "text/plain"
    ? new TextDecoder().decode(input.content.slice(0, 200_000))
    : "";
  const normalizedArtifactText = artifactText.toLowerCase();
  const proposals: Array<z.infer<typeof proposedCapabilitySchema>> = [];

  if (artifactText.trim()) {
    const nonEmptyLines = artifactText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (nonEmptyLines.length >= 2 || /[,\t:]/.test(artifactText)) {
      const evidenceDescription = `The artifact contains organized text or data fields, including: "${excerpt(nonEmptyLines.slice(0, 2).join(" | "))}".`;
      const explanation = "The artifact itself shows information arranged into identifiable entries or fields, which supports a limited evidence-backed capability proposal for information organization.";
      proposals.push({
        capability: "Information organization",
        supportingEvidence: [{ description: evidenceDescription, reference: `${fileReference} · artifact text` }],
        explanation,
        evidenceBasis: explanation,
      });
    }

    if (/\b(?:sale|sales|sold|receipt|customer|order|transaction)\b/i.test(normalizedArtifactText)) {
      const evidenceDescription = `The artifact text contains sales-activity documentation, including: "${excerpt(artifactText)}".`;
      const explanation = "The submitted artifact contains observable sales-related documentation, which supports a limited proposal about documenting sales activity.";
      proposals.push({
        capability: "Sales activity documentation",
        supportingEvidence: [{ description: evidenceDescription, reference: `${fileReference} · artifact text` }],
        explanation,
        evidenceBasis: explanation,
      });
    }
  }

  const hasStructuredContext = Object.values(input.context).every((value) => value.trim().length > 0);
  if (hasStructuredContext && fileReference.trim()) {
    const evidenceDescription = `The submission pairs the artifact "${fileReference}" with student-provided purpose, role, actions, and outcome context.`;
    const explanation = "The observable submission structure connects a concrete artifact to structured evidence context, supporting a limited proposal for evidence organization without claiming broader competence.";
    proposals.push({
      capability: "Evidence organization",
      supportingEvidence: [{ description: evidenceDescription, reference: `${fileReference} + student-provided context` }],
      explanation,
      evidenceBasis: explanation,
    });
  }

  if (proposals.length === 0) {
    throw new Error("SIMULATED AI could not identify a supported evidence-backed capability from the submitted artifact and context.");
  }

  const artifactInspectionNote = artifactText.trim()
    ? `SIMULATED AI inspected the submitted ${category} text artifact and considered the student's context.`
    : `SIMULATED AI considered the submitted ${category} artifact metadata together with the student's context; this deterministic simulation cannot directly interpret non-text binary contents.`;

  return aiAnalysisSchema.parse({
    workSummary: `${artifactInspectionNote} The student describes the purpose as: ${input.context.purpose.slice(0, 500)}`,
    proposedCapabilities: proposals.slice(0, 5),
    supportingObservations: [
      `The private artifact "${fileReference}" is linked to the authenticated student's evidence and was read without replacing or modifying the original source.`,
      `The student-provided context describes actions as: ${input.context.actions.slice(0, 420)}`,
    ],
    limitations: [
      "SIMULATED AI is a deterministic demonstration of the analysis flow and is not a real AI verification or certification system.",
      artifactText.trim()
        ? "The simulation uses only directly available artifact text plus student-provided context and does not establish broad or future capability."
        : "For non-text artifacts, the deterministic simulation does not claim capabilities that require interpreting unseen binary content.",
    ],
    disclaimer: DISCLAIMER,
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

async function llmAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return {
      analysis: assertSafeAnalysis(simulatedAnalysis(input)),
      generatorName: "SIMULATED AI",
      generatorModel: null,
      sourceMode: "simulated",
    };
  }

  const content: Array<Record<string, string>> = [{
    type: "input_text",
    text: `${ANALYSIS_PROMPT}\n\nArtifact metadata:\n${JSON.stringify({ title: input.title, category: input.category, fileName: input.fileName })}\n\nStudent-provided context:\n${JSON.stringify(input.context)}`,
  }];

  if (input.content && input.mimeType === "text/plain") {
    content.push({ type: "input_text", text: `Artifact text:\n${new TextDecoder().decode(input.content.slice(0, 200_000))}` });
  } else if (input.content && input.mimeType?.startsWith("image/")) {
    content.push({ type: "input_image", image_url: `data:${input.mimeType};base64,${base64(input.content)}` });
  } else if (input.content && input.mimeType === "application/pdf") {
    content.push({ type: "input_file", filename: input.fileName ?? "artifact.pdf", file_data: `data:application/pdf;base64,${base64(input.content)}` });
  }

  const model = process.env.LLM_MODEL ?? "gpt-4.1-mini";
  const response = await fetch(process.env.LLM_API_URL ?? "https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "evidence_ai_analysis", strict: true, schema: z.toJSONSchema(aiAnalysisSchema) } },
    }),
  });

  if (!response.ok) throw new Error("The AI analysis service did not return a valid response.");
  const text = responseText(await response.json());
  if (!text) throw new Error("The AI analysis service returned no structured output.");

  try {
    const parsed = aiAnalysisSchema.parse(JSON.parse(text));
    return { analysis: assertSafeAnalysis(parsed), generatorName: "llm-api", generatorModel: model, sourceMode: "ai" };
  } catch (error) {
    if (error instanceof Error && error.message.includes("unsupported capability output")) throw error;
    throw new Error("The AI analysis service returned malformed, empty, or unsupported structured output.");
  }
}

export async function analyzeEvidence(input: AnalysisInput): Promise<AnalysisResult> {
  return llmAnalysis(input);
}
