import { NextResponse } from "next/server";
import { extractStructuredEvidence, uncertainFields } from "@/lib/evidence-extraction";
import { EVIDENCE_BUCKET } from "@/lib/evidence-intake";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { assignedReviewerId } from "@/lib/reviewer-access";
import { reviewRoutingForUncertainty } from "@/lib/review-routing";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { id } = await context.params;
    const admin = createSupabaseAdminClient();
    const { data: evidence, error: evidenceError } = await admin
      .from("evidence_items")
      .select("id, case_id, owner_id, title, category, document_date, original_filename, storage_path, current_version, verification_status")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (evidenceError || !evidence) throw new Error("Evidence was not found for this applicant.");
    const reviewerId = await assignedReviewerId(admin, evidence.case_id);

    let content: Uint8Array | null = null;
    let mimeType: string | null = null;
    if (evidence.storage_path) {
      const { data: blob, error: downloadError } = await admin.storage.from(EVIDENCE_BUCKET).download(evidence.storage_path);
      if (downloadError || !blob) throw new Error("The private evidence source could not be read.");
      content = new Uint8Array(await blob.arrayBuffer());
      mimeType = blob.type;
    }

    const result = await extractStructuredEvidence({
      title: evidence.title,
      category: evidence.category,
      documentDate: evidence.document_date,
      fileName: evidence.original_filename,
      mimeType,
      content,
    });
    const uncertain = uncertainFields(result.extraction);
    const reviewRouting = reviewRoutingForUncertainty(uncertain);
    const { data: latestExtraction } = await admin
      .from("evidence_extractions")
      .select("version")
      .eq("evidence_id", evidence.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (latestExtraction?.version ?? 0) + 1;

    const { error: extractionError } = await admin.from("evidence_extractions").insert({
      evidence_id: evidence.id,
      version,
      extracted_json: result.extraction,
      confidence_json: result.extraction.confidence,
      extractor_name: result.extractorName,
      extractor_model: result.extractorModel,
      extraction_status: "complete",
    });
    if (extractionError) throw new Error("Structured extraction could not be saved.");

    const nextStatus = reviewRouting?.verificationStatus ?? evidence.verification_status;
    const { error: updateError } = await admin.from("evidence_items").update({ current_version: version, verification_status: nextStatus }).eq("id", evidence.id);
    if (updateError) throw new Error("Evidence extraction state could not be updated.");

    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: evidence.id,
      event_type: "extracted",
      actor_id: user.id,
      actor_role: "applicant",
      old_value_json: { verification_status: evidence.verification_status },
      new_value_json: { extraction_version: version, confidence: result.extraction.confidence, verification_status: nextStatus, uncertain_fields: uncertain },
      reason: "Structured extraction completed; confidence indicates extraction uncertainty only.",
    });
    if (auditError) throw new Error("Extraction audit event could not be recorded.");

    if (reviewRouting) {
      const { error: reviewError } = await admin.from("review_items").insert({
        evidence_id: evidence.id,
        case_id: evidence.case_id,
        reason_code: reviewRouting.reasonCode,
        details_json: { extraction_version: version, uncertain_fields: uncertain },
        state: "open",
        assigned_reviewer_id: reviewerId,
      });
      if (reviewError) throw new Error("Uncertain evidence could not be routed to review.");
    }

    return NextResponse.json({ extraction: result.extraction, extractor: result.extractorName, uncertainFields: uncertain, verificationStatus: nextStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to extract evidence.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
