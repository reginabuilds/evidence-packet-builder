import { NextResponse } from "next/server";
import { validateCorrection } from "@/lib/evidence-correction";
import { evidenceExtractionSchema } from "@/lib/evidence-extraction";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { id } = await context.params;
    const correction = validateCorrection(await request.json());
    const admin = createSupabaseAdminClient();
    const { data: evidence, error: evidenceError } = await admin
      .from("evidence_items")
      .select("id, case_id, owner_id, verification_status")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (evidenceError || !evidence) throw new Error("Evidence was not found for this applicant.");

    const { data: latest, error: extractionError } = await admin
      .from("evidence_extractions")
      .select("id, version, extracted_json, confidence_json")
      .eq("evidence_id", evidence.id)
      .order("version", { ascending: false })
      .limit(1)
      .single();
    if (extractionError || !latest) throw new Error("Run structured extraction before making a correction.");

    const original = evidenceExtractionSchema.parse(latest.extracted_json);
    const corrected = evidenceExtractionSchema.parse({ ...original, [correction.field]: correction.value });
    const nextVersion = latest.version + 1;
    const { error: correctionError } = await admin.from("evidence_corrections").insert({
      evidence_id: evidence.id,
      extraction_version: nextVersion,
      field_name: correction.field,
      original_value_json: original[correction.field],
      corrected_value_json: correction.value,
      correction_reason: correction.reason,
      corrected_by: user.id,
    });
    if (correctionError) throw new Error("Correction details could not be recorded.");

    const { error: versionError } = await admin.from("evidence_extractions").insert({
      evidence_id: evidence.id,
      version: nextVersion,
      extracted_json: corrected,
      confidence_json: original.confidence,
      extractor_name: "applicant-correction",
      extractor_model: null,
      extraction_status: "complete",
    });
    if (versionError) throw new Error("Corrected extraction version could not be saved.");

    const { error: updateError } = await admin.from("evidence_items").update({ current_version: nextVersion, verification_status: "pending_review" }).eq("id", evidence.id);
    if (updateError) throw new Error("Correction review state could not be updated.");

    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: evidence.id,
      event_type: "corrected",
      actor_id: user.id,
      actor_role: "applicant",
      old_value_json: { extraction_version: latest.version, field: correction.field, value: original[correction.field], verification_status: evidence.verification_status },
      new_value_json: { extraction_version: nextVersion, field: correction.field, value: correction.value, verification_status: "pending_review" },
      reason: correction.reason,
    });
    if (auditError) throw new Error("Correction audit event could not be recorded.");

    const { error: reviewError } = await admin.from("review_items").insert({
      evidence_id: evidence.id,
      case_id: evidence.case_id,
      reason_code: "applicant_correction",
      details_json: { extraction_version: nextVersion, field: correction.field, original_value: original[correction.field], corrected_value: correction.value },
      state: "open",
    });
    if (reviewError) throw new Error("Corrected evidence could not be sent to human review.");

    return NextResponse.json({ verificationStatus: "pending_review", extractionVersion: nextVersion, reviewState: "open" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save correction.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
