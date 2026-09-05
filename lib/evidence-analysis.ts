import { z } from "zod";

export const proposedCapabilitySchema = z.object({
  capability: z.string().trim().min(2).max(120),
  evidenceBasis: z.string().trim().min(10).max(700),
});

export const aiAnalysisSchema = z.object({
  workSummary: z.string().trim().min(20).max(1200),
  proposedCapabilities: z.array(proposedCapabilitySchema).min(1).max(5),
  supportingObservations: z.array(z.string().trim().min(10).max(700)).min(1).max(6),
  limitations: z.array(z.string().trim().min(10).max(700)).min(1).max(6),
  disclaimer: z.literal("AI-generated proposal. This analysis is not verified fact and does not certify, score, rank, or guarantee capability."),
});

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

const ANALYSIS_PROMPT = `You analyze one student's submitted work artifact together with context written by that student.
Your output is a proposal only. It is not verified fact and must never certify competence.
Describe only evidence-backed capability proposals that are reasonably supported by the artifact and student-provided context.
Do not produce numeric scores, confidence percentages, rankings, grades, badges, certificates, trajectory recommendations, career recommendations, job matching, hiring recommendations, future-performance predictions, or guarantees.
Do not call any capability "verified", "certified", "proven", or "guaranteed".
Clearly state limitations, including where a claim depends only on student-provided context or where the artifact does not directly establish a capability.
Return only JSON matching the supplied schema.`;

const forbiddenOutputPatterns = [
  /\b(?:score|scored|scoring)\b/i,
  /\b(?:rank|ranked|ranking)\b/i,
  /\b(?:certificate|certified|certification)\b/i,
  /\bverified skill\b/i,
  /\bguarantee(?:d|s)?\b/i,
  /\bjob match(?:ing)?\b/i,
  /\btrajectory recommendation\b/i,
  /\bhiring recommendation\b/i,
];

function assertSafeAnalysis(analysis: AiAnalysis) {
  const text = JSON.stringify({
    workSummary: analysis.workSummary,
    proposedCapabilities: analysis.proposedCapabilities,
    supportingObservations: analysis.supportingObservations,
    limitations: analysis.limitations,
  });
  if (forbiddenOutputPatterns.some((pattern) => pattern.test(text))) {
    throw new Error("AI analysis contained forbidden scope and was not saved.");
  }
  return analysis;
}

function simulatedAnalysis(input: AnalysisInput): AiAnalysis {
  const category = input.category.replaceAll("_", " ");
  return aiAnalysisSchema.parse({
    workSummary: `This simulated analysis considers the submitted ${category} artifact together with the student's description of the work. The student describes the purpose as: ${input.context.purpose.slice(0, 500)}`,
    proposedCapabilities: [
      {
        capability: "Evidence-backed execution",
        evidenceBasis: `The student reports responsibility for ${input.context.role.slice(0, 260)} and describes actions including ${input.context.actions.slice(0, 320)}. This is a proposed interpretation and does not establish capability as fact.`,
      },
    ],
    supportingObservations: [
      `A submitted artifact named ${input.fileName ?? "artifact"} is associated with the student's account and is considered alongside the student's own context.`,
      `The student describes the outcome as: ${input.context.outcome.slice(0, 420)}`,
    ],
    limitations: [
      "This simulated proposal does not independently verify that the student's description is complete or accurate.",
      "One artifact can support a limited evidence-backed interpretation, but it cannot establish broad or future capability on its own.",
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
      generatorName: "deterministic-simulated-analysis",
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
  const analysis = assertSafeAnalysis(aiAnalysisSchema.parse(JSON.parse(text)));
  return { analysis, generatorName: "llm-api", generatorModel: model, sourceMode: "ai" };
}

export async function analyzeEvidence(input: AnalysisInput): Promise<AnalysisResult> {
  return llmAnalysis(input);
}
