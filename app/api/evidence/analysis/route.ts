import { NextResponse } from "next/server";
import { analyzeEvidence } from "@/lib/evidence-analysis";
import { EVIDENCE_BUCKET } from "@/lib/evidence-intake";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function authenticateApplicant(request: Request) {
  const user = await getAuthenticatedUser(request);
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "applicant") throw new Error("Unauthorized applicant session.");
  return { user, admin };
}

export async function GET(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    const { data, error } = await admin
      .from("evidence_ai_analyses")
      .select("id, evidence_id, analysis_json, generator_name, generator_model, source_mode, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("Unable to load AI analysis.");
    return NextResponse.json({ analysis: data ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load AI analysis.";
    const status = message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    enforceEvidenceIntakeRateLimit(user.id);

    const { data: context, error: contextError } = await admin
      .from("evidence_context")
      .select("evidence_id, purpose, role, actions, outcome")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (contextError || !context) throw new Error("Submit student-provided context before running AI analysis.");

    const { data: evidence, error: evidenceError } = await admin
      .from("evidence_items")
      .select("id, owner_id, title, category, original_filename, storage_path")
      .eq("id", context.evidence_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (evidenceError || !evidence) throw new Error("The artifact linked to this context was not found.");

    let content: Uint8Array | null = null;
    let mimeType: string | null = null;
    if (evidence.storage_path) {
      const { data: blob, error: downloadError } = await admin.storage.from(EVIDENCE_BUCKET).download(evidence.storage_path);
      if (downloadError || !blob) throw new Error("The private artifact could not be read for analysis.");
      content = new Uint8Array(await blob.arrayBuffer());
      mimeType = blob.type;
    }

    const result = await analyzeEvidence({
      title: evidence.title,
      category: evidence.category,
      fileName: evidence.original_filename,
      mimeType,
      content,
      context: {
        purpose: context.purpose,
        role: context.role,
        actions: context.actions,
        outcome: context.outcome,
      },
    });

    const { data: saved, error: saveError } = await admin
      .from("evidence_ai_analyses")
      .insert({
        evidence_id: evidence.id,
        owner_id: user.id,
        analysis_json: result.analysis,
        generator_name: result.generatorName,
        generator_model: result.generatorModel,
        source_mode: result.sourceMode,
      })
      .select("id, evidence_id, analysis_json, generator_name, generator_model, source_mode, created_at")
      .single();
    if (saveError) throw new Error("AI analysis could not be saved.");

    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: evidence.id,
      event_type: "ai_analysis_proposed",
      actor_id: user.id,
      actor_role: "applicant",
      new_value_json: { analysis_id: saved.id, source_mode: result.sourceMode, generator_name: result.generatorName },
      reason: "AI-generated or simulated proposal only; not verified fact and not a certification of capability.",
    });
    if (auditError) throw new Error("AI analysis audit event could not be recorded.");

    return NextResponse.json({ analysis: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run AI analysis.";
    const status = message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
