import { NextResponse } from "next/server";
import { validateEvidenceIntake, EVIDENCE_BUCKET } from "@/lib/evidence-intake";
import { getAuthenticatedUser, createSupabaseAdminClient } from "@/lib/supabase/server";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const body = await request.json();
    const input = validateEvidenceIntake(body);
    const storagePath = typeof body.storagePath === "string" ? body.storagePath : "";
    const pathPrefix = `${user.id}/`;
    if (!storagePath.startsWith(pathPrefix) || storagePath.includes("..")) throw new Error("Invalid private upload path.");

    const objectName = storagePath.slice(pathPrefix.length);
    const admin = createSupabaseAdminClient();
    const { data: objects, error: listError } = await admin.storage.from(EVIDENCE_BUCKET).list(user.id, { search: objectName });
    const uploadedObject = objects?.find((object) => object.name === objectName);
    if (listError || !uploadedObject) throw new Error("The private upload could not be verified.");

    const metadata = uploadedObject.metadata as { size?: number; mimetype?: string } | null;
    if (metadata?.size !== input.fileSize || metadata?.mimetype !== input.mimeType) {
      throw new Error("Uploaded file metadata does not match the validated intake request.");
    }

    const { data: caseData, error: caseError } = await admin
      .from("cases")
      .select("id")
      .eq("applicant_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();
    if (caseError || !caseData) throw new Error("No active approved demo case is available.");

    const { data: evidence, error: evidenceError } = await admin
      .from("evidence_items")
      .insert({
        case_id: caseData.id,
        owner_id: user.id,
        title: input.title,
        category: input.category,
        source_type: "uploaded_document",
        original_filename: input.fileName,
        storage_path: storagePath,
        file_hash: input.fileHash,
        document_date: input.documentDate ?? null,
        verification_status: "unverified",
      })
      .select("id, title, verification_status, uploaded_at")
      .single();
    if (evidenceError || !evidence) throw new Error("Unable to record evidence metadata.");

    const { error: provenanceError } = await admin.from("provenance_records").insert({
      evidence_id: evidence.id,
      source_type: "uploaded_document",
      source_name: "Applicant-uploaded demo document",
      original_filename: input.fileName,
      storage_path: storagePath,
      file_hash: input.fileHash,
      uploaded_by: user.id,
      uploaded_at: evidence.uploaded_at,
      declared_document_date: input.documentDate ?? null,
    });
    if (provenanceError) throw new Error("Evidence provenance could not be recorded.");

    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: evidence.id,
      event_type: "created",
      actor_id: user.id,
      actor_role: "applicant",
      new_value_json: { demo_only: true, source_type: "uploaded_document" },
      reason: "Applicant uploaded invented demo evidence.",
    });
    if (auditError) throw new Error("Evidence audit event could not be recorded.");

    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to finalize evidence upload.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
