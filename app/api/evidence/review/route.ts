import { NextResponse } from "next/server";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
type Decision = "accepted" | "rejected" | "removed";

async function authenticateApplicant(request: Request) {
  const user = await getAuthenticatedUser(request);
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error || profile?.role !== "applicant") throw new Error("Unauthorized applicant session.");
  return { user, admin };
}
function proposalId(analysisId: string, proposalIndex: number) { return `${analysisId}:${proposalIndex}`; }

export async function GET(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("analysisId");
    const query = admin.from("evidence_ai_analyses").select("id, evidence_id, analysis_json, generator_name, generator_model, source_mode, created_at").eq("owner_id", user.id).order("created_at", { ascending: false });
    const { data: analysis, error } = analysisId ? await query.eq("id", analysisId).maybeSingle() : await query.limit(1).maybeSingle();
    if (error) throw new Error("Unable to load AI proposal.");
    if (!analysis) throw new Error("AI analysis proposal not found.");
    const { data: decisions, error: decisionsError } = await admin.from("evidence_ai_proposal_reviews").select("id, analysis_id, evidence_id, proposal_index, proposal_id, student_id, decision, edited_capability, edited_explanation, decided_at").eq("analysis_id", analysis.id).eq("student_id", user.id).order("proposal_index", { ascending: true });
    if (decisionsError) throw new Error("Unable to load student review decisions.");
    return NextResponse.json({ analysis, decisions: decisions ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load student review.";
    const status = message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    const body = await request.json().catch(() => null) as { analysisId?: unknown; proposalIndex?: unknown; decision?: unknown; editedCapability?: unknown; editedExplanation?: unknown } | null;
    const analysisId = typeof body?.analysisId === "string" ? body.analysisId : "";
    const proposalIndex = typeof body?.proposalIndex === "number" && Number.isInteger(body.proposalIndex) ? body.proposalIndex : -1;
    const decision = body?.decision === "accepted" || body?.decision === "rejected" || body?.decision === "removed" ? body.decision : null;
    const editedCapability = typeof body?.editedCapability === "string" ? body.editedCapability.trim() : null;
    const editedExplanation = typeof body?.editedExplanation === "string" ? body.editedExplanation.trim() : null;
    if (!/^[0-9a-f-]{36}$/i.test(analysisId) || proposalIndex < 0 || !decision) return NextResponse.json({ error: "Invalid proposal review request." }, { status: 400 });

    const { data: analysis, error: analysisError } = await admin.from("evidence_ai_analyses").select("id, evidence_id, owner_id, analysis_json").eq("id", analysisId).eq("owner_id", user.id).maybeSingle();
    if (analysisError) throw new Error("Unable to load AI proposal.");
    if (!analysis) return NextResponse.json({ error: "Unauthorized artifact or AI proposal." }, { status: 403 });
    const { data: evidence, error: evidenceError } = await admin.from("evidence_items").select("id, owner_id").eq("id", analysis.evidence_id).eq("owner_id", user.id).maybeSingle();
    if (evidenceError) throw new Error("Unable to verify artifact ownership.");
    if (!evidence) return NextResponse.json({ error: "Unauthorized artifact." }, { status: 403 });
    const proposals = (analysis.analysis_json as { proposedCapabilities?: unknown }).proposedCapabilities;
    if (!Array.isArray(proposals) || proposalIndex >= proposals.length || !proposals[proposalIndex]) return NextResponse.json({ error: "AI proposal not found." }, { status: 404 });
    if (decision === "accepted" && editedCapability !== null && !editedCapability) return NextResponse.json({ error: "Edited capability cannot be empty." }, { status: 400 });

    const id = proposalId(analysis.id, proposalIndex);
    const { data: existing, error: existingError } = await admin.from("evidence_ai_proposal_reviews").select("id, decision, student_id, edited_capability, edited_explanation").eq("analysis_id", analysis.id).eq("proposal_index", proposalIndex).maybeSingle();
    if (existingError) throw new Error("Unable to check existing student decision.");
    if (existing && existing.decision === decision && existing.edited_capability === editedCapability && existing.edited_explanation === editedExplanation) return NextResponse.json({ error: "This proposal already has that student decision." }, { status: 409 });

    const payload = { decision, student_id: user.id, evidence_id: evidence.id, proposal_id: id, edited_capability: editedCapability || null, edited_explanation: editedExplanation || null, decided_at: new Date().toISOString() };
    let saved;
    if (existing) {
      const { data, error } = await admin.from("evidence_ai_proposal_reviews").update(payload).eq("id", existing.id).eq("student_id", user.id).select("id, analysis_id, evidence_id, proposal_index, proposal_id, student_id, decision, edited_capability, edited_explanation, decided_at").single();
      if (error) throw new Error("Student decision could not be saved.");
      saved = data;
    } else {
      const { data, error } = await admin.from("evidence_ai_proposal_reviews").insert({ analysis_id: analysis.id, evidence_id: evidence.id, proposal_index: proposalIndex, proposal_id: id, ...payload }).select("id, analysis_id, evidence_id, proposal_index, proposal_id, student_id, decision, edited_capability, edited_explanation, decided_at").single();
      if (error) throw new Error(error.code === "23505" ? "This proposal already has a student decision." : "Student decision could not be saved.");
      saved = data;
    }

    const { error: auditError } = await admin.from("transformation_events").insert({ evidence_id: evidence.id, event_type: "review_resolved", actor_id: user.id, actor_role: "applicant", new_value_json: { analysis_id: analysis.id, proposal_id: id, proposal_index: proposalIndex, decision, edited: Boolean(editedCapability || editedExplanation), student_id: user.id }, reason: `Student review decision: ${decision}. This records the student's decision on an AI proposal and does not certify capability.` });
    if (auditError) throw new Error("Student decision audit event could not be recorded.");
    return NextResponse.json({ review: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save student review.";
    const status = message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
