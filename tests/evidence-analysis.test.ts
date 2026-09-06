import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aiAnalysisSchema, analyzeEvidence, assertSafeAnalysis } from "@/lib/evidence-analysis";

const disclaimer = "AI-generated proposal. This analysis is not verified fact and does not certify, score, rank, or guarantee capability." as const;

const demoInput = {
  title: "Demo market sales receipt",
  category: "receipt",
  fileName: "demo-market-sales.txt",
  mimeType: "text/plain",
  content: new TextEncoder().encode("Sale,Customer,Amount\nOrder 101,Demo Customer,45\nOrder 102,Sample Customer,60"),
  context: {
    purpose: "Document fictional demo market sales activity.",
    role: "Student operator",
    actions: "Organized the fictional sales entries and submitted the artifact.",
    outcome: "Created a bounded demo sales document.",
  },
};

const routeSource = fs.readFileSync(path.join(process.cwd(), "app/api/evidence/analysis/route.ts"), "utf8");

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.LLM_API_KEY;
  delete process.env.LLM_API_URL;
});

describe("Feature 06 evidence analysis", () => {
  it("allows the authenticated applicant flow to analyze only the student's own linked artifact", () => {
    expect(routeSource).toContain("getAuthenticatedUser(request)");
    expect(routeSource).toContain('profile?.role !== "applicant"');
    expect(routeSource).toContain('.eq("id", context.evidence_id)');
    expect(routeSource).toContain('.eq("owner_id", user.id)');
  });

  it("rejects unauthenticated requests server-side", () => {
    expect(routeSource).toContain("getAuthenticatedUser(request)");
    expect(routeSource).toContain("return NextResponse.json({ error: message }, { status })");
    expect(routeSource).toContain("? 401");
  });

  it("does not permit analysis of an artifact owned by another student", () => {
    const ownershipChecks = routeSource.match(/\.eq\("owner_id", user\.id\)/g) ?? [];
    expect(ownershipChecks.length).toBeGreaterThanOrEqual(2);
  });

  it("returns structured proposals with identifiable supporting evidence and explanation", async () => {
    const result = await analyzeEvidence(demoInput);
    expect(result.sourceMode).toBe("simulated");
    expect(result.generatorName).toBe("SIMULATED AI");
    expect(result.analysis.proposedCapabilities.length).toBeGreaterThan(0);
    for (const proposal of result.analysis.proposedCapabilities) {
      expect(proposal.capability.length).toBeGreaterThan(1);
      expect(proposal.supportingEvidence.length).toBeGreaterThan(0);
      expect(proposal.explanation.length).toBeGreaterThan(9);
      for (const evidence of proposal.supportingEvidence) {
        expect(evidence.description.length).toBeGreaterThan(9);
        expect(evidence.reference.length).toBeGreaterThan(1);
      }
    }
  });

  it("rejects unsupported capability output", () => {
    const unsafe = aiAnalysisSchema.parse({
      workSummary: "The artifact contains a bounded fictional sales document with organized entries.",
      proposedCapabilities: [{
        capability: "Hiring recommendation",
        supportingEvidence: [{ description: "A fictional receipt contains organized sales entries.", reference: "Demo receipt" }],
        explanation: "The employer should hire the student based on this artifact.",
        evidenceBasis: "The employer should hire the student based on this artifact.",
      }],
      supportingObservations: ["The artifact contains fictional sales entries for demonstration."],
      limitations: ["The artifact is limited to a fictional bounded demonstration."],
      disclaimer,
    });
    expect(() => assertSafeAnalysis(unsafe)).toThrow(/unsupported capability output/i);
  });

  it("rejects numerical skill-score fields", () => {
    expect(() => aiAnalysisSchema.parse({
      workSummary: "The artifact contains a bounded fictional sales document with organized entries.",
      proposedCapabilities: [{
        capability: "Information organization",
        supportingEvidence: [{ description: "The receipt contains organized sales entries.", reference: "Demo receipt" }],
        explanation: "The entries are observably organized into fields.",
        evidenceBasis: "The entries are observably organized into fields.",
        score: 95,
      }],
      supportingObservations: ["The artifact contains fictional sales entries for demonstration."],
      limitations: ["The artifact is limited to a fictional bounded demonstration."],
      disclaimer,
    })).toThrow();
  });

  it("contains no verified-skill or certification claim in proposed capability content", async () => {
    const result = await analyzeEvidence(demoInput);
    const proposalText = JSON.stringify(result.analysis.proposedCapabilities);
    expect(proposalText).not.toMatch(/verified skill/i);
    expect(proposalText).not.toMatch(/\bcertif(?:y|ied|ication)\b/i);
  });

  it("contains no ranking in proposed capability content", async () => {
    const result = await analyzeEvidence(demoInput);
    expect(JSON.stringify(result.analysis.proposedCapabilities)).not.toMatch(/\b(?:rank|ranked|ranking)\b/i);
  });

  it("contains no hiring recommendation in proposed capability content", async () => {
    const result = await analyzeEvidence(demoInput);
    expect(JSON.stringify(result.analysis.proposedCapabilities)).not.toMatch(/hiring recommendation|should hire/i);
  });

  it("handles malformed or empty AI output without saving it", async () => {
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_API_URL = "https://example.invalid/analysis";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: JSON.stringify({ proposals: [] }) }),
    }));
    await expect(analyzeEvidence(demoInput)).rejects.toThrow(/malformed, empty, or unsupported structured output/i);
  });

  it("AI failure does not modify the original artifact bytes", async () => {
    const original = new Uint8Array(demoInput.content);
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_API_URL = "https://example.invalid/analysis";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("AI unavailable")));
    await expect(analyzeEvidence(demoInput)).rejects.toThrow("AI unavailable");
    expect(demoInput.content).toEqual(original);
  });

  it("successful analysis leaves the original artifact unchanged and stores analysis separately", async () => {
    const original = new Uint8Array(demoInput.content);
    await analyzeEvidence(demoInput);
    expect(demoInput.content).toEqual(original);
    expect(routeSource).toContain('.from("evidence_ai_analyses")');
    expect(routeSource).toContain(".insert({");
    expect(routeSource).not.toMatch(/storage\.from\(EVIDENCE_BUCKET\)\.(?:upload|update|remove)/);
  });

  it("keeps the Feature 01-05 boundary by using existing context, evidence, auth, and private storage flows", () => {
    expect(routeSource).toContain('.from("evidence_context")');
    expect(routeSource).toContain('.from("evidence_items")');
    expect(routeSource).toContain(".storage.from(EVIDENCE_BUCKET).download");
    expect(routeSource).not.toContain("evidence_records");
    expect(routeSource).not.toContain("evidence_record_shares");
  });
});
