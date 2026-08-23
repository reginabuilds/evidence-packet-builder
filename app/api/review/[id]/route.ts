import { NextResponse } from "next/server";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireReviewer } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { id } = await context.params;
    const admin = createSupabaseAdminClient();
    await requireReviewer(admin, user.id);
    const { data: item, error } = await admin.from("review_items").select("id, evidence_id, case_id, reason_code, details_json, state, created_at, assigned_reviewer_id").eq("id", id).eq("assigned_reviewer_id", user.id).single();
    if (error || !item) throw new Error("This review item is not assigned to you.");
    const { data: assignment } = await admin.from("case_reviewer_assignments").select("reviewer_id").eq("case_id", item.case_id).eq("reviewer_id", user.id).maybeSingle();
    if (!assignment) throw new Error("You are not assigned to this pilot case.");

    const [evidenceResult, provenanceResult, extractionResult, eventsResult, correctionsResult, resolutionResult] = await Promise.all([
      admin.from("evidence_items").select("id, title, category, source_type, original_filename, document_date, uploaded_at, verification_status, excluded_by_applicant, current_version").eq("id", item.evidence_id).single(),
      admin.from("provenance_records").select("source_type, source_name, original_filename, file_hash, uploaded_at, declared_document_date, created_at").eq("evidence_id", item.evidence_id).single(),
      admin.from("evidence_extractions").select("version, extracted_json, confidence_json, extractor_name, extractor_model, extraction_status, created_at").eq("evidence_id", item.evidence_id).order("version", { ascending: false }),
      admin.from("transformation_events").select("event_type, actor_role, old_value_json, new_value_json, reason, created_at").eq("evidence_id", item.evidence_id).order("created_at", { ascending: false }),
      admin.from("evidence_corrections").select("field_name, original_value_json, corrected_value_json, correction_reason, created_at").eq("evidence_id", item.evidence_id).order("created_at", { ascending: false }),
      admin.from("review_resolutions").select("decision, resolution_note, created_at").eq("review_item_id", item.id).maybeSingle(),
    ]);
    if (evidenceResult.error) throw new Error("Evidence for this review item is unavailable.");
    return NextResponse.json({
      item,
      evidence: evidenceResult.data,
      provenance: provenanceResult.data,
      extractions: extractionResult.data ?? [],
      events: eventsResult.data ?? [],
      corrections: correctionsResult.data ?? [],
      resolution: resolutionResult.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load review item.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("human reviewer") || message.includes("not assigned") ? 403 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
