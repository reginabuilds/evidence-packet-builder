import { NextResponse } from "next/server";
import { buildEvidenceRecord } from "@/lib/evidence-record";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function authenticateApplicant(request: Request) {
  const user = await getAuthenticatedUser(request);
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "applicant") throw new Error("Unauthorized applicant session.");
  return { user, admin };
}

async function loadLatestRecord(admin: ReturnType<typeof createSupabaseAdminClient>, ownerId: string) {
  const { data, error } = await admin
    .from("evidence_records")
    .select("id, evidence_id, record_version, status, approval_status, record_json, created_at")
    .eq("owner_id", ownerId)
    .order("record_version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to load the Evidence Record.");
  return data ?? null;
}

export async function GET(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    return NextResponse.json({ record: await loadLatestRecord(admin, user.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the Evidence Record.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);

    const { data: context, error: contextError } = await admin
      .from("evidence_context")
      .select("evidence_id, purpose, role, actions, outcome")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (contextError || !context) throw new Error("Submit student-provided context before generating an Evidence Record.");

    const { data: evidence, error: evidenceError } = await admin
      .from("evidence_items")
      .select("id, owner_id, title, category, original_filename, uploaded_at")
      .eq("id", context.evidence_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (evidenceError || !evidence) throw new Error("The artifact linked to this context was not found.");

    const { data: aiAnalysis, error: aiError } = await admin
      .from("evidence_ai_analyses")
      .select("id, evidence_id, analysis_json, generator_name, generator_model, source_mode, created_at")
      .eq("evidence_id", evidence.id)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (aiError || !aiAnalysis) throw new Error("Run AI analysis before generating an Evidence Record.");

    const analysis = aiAnalysis.analysis_json as {
      workSummary: string;
      proposedCapabilities: Array<{ capability: string; evidenceBasis: string }>;
      supportingObservations: string[];
      limitations: string[];
      disclaimer: string;
    };

    const record = buildEvidenceRecord({
      artifact: {
        evidenceId: evidence.id,
        title: evidence.title,
        category: evidence.category,
        originalFilename: evidence.original_filename,
        submittedAt: evidence.uploaded_at,
      },
      context: {
        purpose: context.purpose,
        role: context.role,
        actions: context.actions,
        outcome: context.outcome,
      },
      aiProposal: {
        analysisId: aiAnalysis.id,
        sourceMode: aiAnalysis.source_mode,
        generatorName: aiAnalysis.generator_name,
        generatorModel: aiAnalysis.generator_model,
        workSummary: analysis.workSummary,
        proposedCapabilities: analysis.proposedCapabilities,
        supportingObservations: analysis.supportingObservations,
        limitations: analysis.limitations,
        disclaimer: analysis.disclaimer,
      },
    });

    const { data: latest } = await admin
      .from("evidence_records")
      .select("record_version")
      .eq("evidence_id", evidence.id)
      .order("record_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (latest?.record_version ?? 0) + 1;

    const { data: saved, error: saveError } = await admin
      .from("evidence_records")
      .insert({
        evidence_id: evidence.id,
        owner_id: user.id,
        record_version: version,
        status: "draft",
        approval_status: "not_yet_approved",
        record_json: record,
      })
      .select("id, evidence_id, record_version, status, approval_status, record_json, created_at")
      .single();
    if (saveError) throw new Error("Evidence Record could not be saved.");

    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: evidence.id,
      event_type: "evidence_record_generated",
      actor_id: user.id,
      actor_role: "applicant",
      new_value_json: { record_id: saved.id, record_version: version, approval_status: "not_yet_approved", ai_analysis_id: aiAnalysis.id },
      reason: "Draft Evidence Record generated from student-provided artifact/context plus an explicitly labeled AI proposal; no AI content is treated as verified fact.",
    });
    if (auditError) throw new Error("Evidence Record audit event could not be recorded.");

    return NextResponse.json({ record: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate the Evidence Record.";
    const status = message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
